"use client"

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FacialRecognition } from "@/components/facial-recognition";
import { QRCodeGenerator } from "@/components/qr-code-generator";
import { UserPlus, Pencil, Trash2, Search, Loader2, QrCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { hash } from "bcrypt";

// User interface for TypeScript
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  classId?: string | null;
  class?: {
    id: string;
    grade: number;
    section: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
  password?: string; // Make password optional for updates
  qrCode?: string;
}

// Class interface
interface ClassOption {
  id: string;
  grade: number;
  section: string;
}

export function UsersManagement() {  const { toast } = useToast();  const [users, setUsers] = useState<User[]>([]);  const [classes, setClasses] = useState<ClassOption[]>([]);  const [isLoading, setIsLoading] = useState(true);  const [searchTerm, setSearchTerm] = useState("");  const [currentTab, setCurrentTab] = useState("all");  const [newUser, setNewUser] = useState({    name: "",    email: "",    role: "STUDENT",    password: "",    confirmPassword: "",    classId: "",  });  const [faceRegistered, setFaceRegistered] = useState(false);  const [qrCodeGenerated, setQrCodeGenerated] = useState(false);  const [qrCodeData, setQrCodeData] = useState("");  const [selectedUser, setSelectedUser] = useState<User | null>(null);  const [isAddUserOpen, setIsAddUserOpen] = useState(false);  const [isEditUserOpen, setIsEditUserOpen] = useState(false);  const [isDeleteUserOpen, setIsDeleteUserOpen] = useState(false);  const [createdUserId, setCreatedUserId] = useState<string | null>(null);  const [faceRegistrationStep, setFaceRegistrationStep] = useState(false);  const [showPassword, setShowPassword] = useState(false);  const [showConfirmPassword, setShowConfirmPassword] = useState(false);  const [editFaceRegistered, setEditFaceRegistered] = useState(false);

  // Fetch users and classes from the database
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch users
        const usersResponse = await fetch('/api/users');
        if (!usersResponse.ok) {
          throw new Error('Failed to fetch users');
        }
        const usersData = await usersResponse.json();
        setUsers(usersData.users);
        
        // Fetch classes for student assignment
        const classesResponse = await fetch('/api/classes');
        if (!classesResponse.ok) {
          throw new Error('Failed to fetch classes');
        }
        const classesData = await classesResponse.json();
        setClasses(classesData.classes);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load data. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const filteredUsers = users.filter(user => {
    // Filter by tab
    if (currentTab !== "all" && user.role !== currentTab.toUpperCase()) {
      return false;
    }
    
    // Filter by search term
    if (searchTerm && 
        !user.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !user.email.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  const handleAddUser = async () => {
    try {
      // For students, classId is required
      if (newUser.role === "STUDENT" && !newUser.classId) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please select a class for the student",
        });
        return;
      }

      // Check if passwords match
      if (newUser.password !== newUser.confirmPassword) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Passwords do not match",
        });
        return;
      }

      // If we're in the face registration step and no face was registered, show a warning
      if (faceRegistrationStep && !faceRegistered && !qrCodeGenerated) {
        toast({
          variant: "destructive",
          title: "Warning",
          description: "Face and QR code not registered. User will be created without biometric authentication.",
        });
      }

      // Remove confirmPassword before sending to API
      const { confirmPassword, ...userDataToSend } = newUser;

      // If we haven't created the user yet
      if (!faceRegistrationStep) {
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userDataToSend),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to create user');
        }

        const data = await response.json();
        setCreatedUserId(data.user.id);
        
        // Generate QR code for the user
        try {
          const qrResponse = await fetch('/api/auth/generate-qr', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: data.user.id }),
          });
          
          if (qrResponse.ok) {
            const qrData = await qrResponse.json();
            setQrCodeData(qrData.qrCodeData);
            setQrCodeGenerated(true);
          }
        } catch (qrError) {
          console.error('Error generating QR code:', qrError);
          toast({
            variant: "destructive",
            title: "Warning",
            description: "Failed to generate QR code. User will be created without QR code for authentication.",
          });
        }
        
        // If facial recognition is to be set up, go to the next step
        setFaceRegistrationStep(true);
        return;
      }

      // If we're here, it means we're completing registration after face setup
      toast({
        title: "Success",
        description: `User ${newUser.name} created successfully.`,
      });

      // Reset form and close dialog
      setNewUser({
        name: "",
        email: "",
        role: "STUDENT",
        password: "",
        confirmPassword: "",
        classId: "",
      });
      setFaceRegistrationStep(false);
      setCreatedUserId(null);
      setFaceRegistered(false);
      setQrCodeGenerated(false);
      setQrCodeData("");
      setIsAddUserOpen(false);
      
      // Refresh the user list
      const usersResponse = await fetch('/api/users');
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData.users);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create user",
      });
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(selectedUser),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update user');
      }

      const data = await response.json();
      setUsers(users.map(user => (user.id === selectedUser.id ? data.user : user)));
      setIsEditUserOpen(false);

      toast({
        title: "Success",
        description: "User updated successfully",
      });
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update user",
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      // First try to delete the facial recognition data
      try {
        const faceResponse = await fetch(`/api/face/delete/${selectedUser.id}`, {
          method: 'DELETE',
        });
        
        // We don't need to check the response - continue even if this fails
        // Just log it for debugging
        if (!faceResponse.ok) {
          console.log(`Note: Could not delete facial recognition data for user: ${selectedUser.id}`);
        } else {
          console.log(`Successfully deleted facial recognition data for user: ${selectedUser.id}`);
        }
      } catch (faceError) {
        console.error('Error deleting facial recognition data:', faceError);
        // Continue with user deletion even if face deletion fails
      }

      // Now delete the user account
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete user');
      }

      setUsers(users.filter(user => user.id !== selectedUser.id));
      setIsDeleteUserOpen(false);

      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete user",
      });
    }
  };

  const handleEditClick = async (user: User) => {
    setSelectedUser(user);
    setIsEditUserOpen(true);
    
    // Fetch the latest user data including QR code
    try {
      const response = await fetch(`/api/users/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedUser(data.user);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Users Management</h2>
          <p className="text-muted-foreground">
            Manage all users in the system
          </p>
        </div>
        
        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{faceRegistrationStep ? "Complete User Setup" : "Add New User"}</DialogTitle>
              <DialogDescription>
                {faceRegistrationStep ? "Complete the following steps to finish setting up the user." : "Fill out the form below to create a new user."}
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue={faceRegistrationStep ? "qrcode" : "details"}>
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="details" disabled={faceRegistrationStep}>
                  User Details
                </TabsTrigger>
                <TabsTrigger value="qrcode" disabled={!createdUserId}>
                  QR Code
                </TabsTrigger>
                <TabsTrigger value="face" disabled={!createdUserId}>
                  Face Recognition
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input 
                      id="name" 
                      value={newUser.name}
                      onChange={e => setNewUser({...newUser, name: e.target.value})}
                      placeholder="Enter full name" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email"
                      value={newUser.email}
                      onChange={e => setNewUser({...newUser, email: e.target.value})}
                      placeholder="Enter email" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={newUser.role}
                      onValueChange={value => setNewUser({...newUser, role: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="STUDENT">Student</SelectItem>
                        <SelectItem value="TEACHER">Teacher</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input 
                        id="password" 
                        type={showPassword ? "text" : "password"}
                        value={newUser.password}
                        onChange={e => setNewUser({...newUser, password: e.target.value})}
                        placeholder="Enter password" 
                      />
                      <button 
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Input 
                        id="confirmPassword" 
                        type={showConfirmPassword ? "text" : "password"}
                        value={newUser.confirmPassword}
                        onChange={e => setNewUser({...newUser, confirmPassword: e.target.value})}
                        placeholder="Confirm password" 
                      />
                      <button 
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {newUser.role === "STUDENT" && (
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="class">Assign to Class</Label>
                      <Select
                        value={newUser.classId}
                        onValueChange={value => setNewUser({...newUser, classId: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                          {classes.map(cls => (
                            <SelectItem key={cls.id} value={cls.id}>
                              Grade {cls.grade} - Section {cls.section}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="qrcode">
                {createdUserId ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>User QR Code</CardTitle>
                      <CardDescription>
                        Generate and download the user's unique QR code for authentication
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {qrCodeGenerated && qrCodeData ? (
                        <QRCodeGenerator 
                          qrCodeData={qrCodeData}
                          userName={newUser.name}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 space-y-4">
                          <QrCode className="h-16 w-16 text-primary/30" />
                          <p className="text-muted-foreground">QR code not yet generated</p>
                          <Button 
                            onClick={async () => {
                              try {
                                const qrResponse = await fetch('/api/auth/generate-qr', {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({ userId: createdUserId }),
                                });
                                
                                if (qrResponse.ok) {
                                  const qrData = await qrResponse.json();
                                  setQrCodeData(qrData.qrCodeData);
                                  setQrCodeGenerated(true);
                                  toast({
                                    title: "Success",
                                    description: "QR code generated successfully",
                                  });
                                } else {
                                  throw new Error('Failed to generate QR code');
                                }
                              } catch (error) {
                                console.error('Error:', error);
                                toast({
                                  variant: "destructive",
                                  title: "Error",
                                  description: "Failed to generate QR code. Please try again.",
                                });
                              }
                            }}
                          >
                            Generate QR Code
                          </Button>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="justify-between">
                      <div>
                        {qrCodeGenerated ? (
                          <p className="text-sm text-green-500">QR code generated successfully!</p>
                        ) : (
                          <p className="text-sm text-muted-foreground">QR code not yet generated</p>
                        )}
                      </div>
                    </CardFooter>
                  </Card>
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-muted-foreground">Please create the user first before generating a QR code</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="face">
                {createdUserId ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Register Face</CardTitle>
                      <CardDescription>
                        Capture a clear image of the user's face for recognition
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <FacialRecognition 
                        mode="registration"
                        userId={createdUserId}
                        onRecognized={() => setFaceRegistered(true)} 
                      />
                    </CardContent>
                    <CardFooter className="justify-between">
                      <div>
                        {faceRegistered ? (
                          <p className="text-sm text-green-500">Face registered successfully!</p>
                        ) : (
                          <p className="text-sm text-muted-foreground">Face not yet registered</p>
                        )}
                      </div>
                    </CardFooter>
                  </Card>
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-muted-foreground">Please create the user first before registering a face</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsAddUserOpen(false);
                setFaceRegistrationStep(false);
                setCreatedUserId(null);
                setFaceRegistered(false);
                setQrCodeGenerated(false);
                setQrCodeData("");
              }}>
                Cancel
              </Button>
              <Button onClick={handleAddUser}>
                {faceRegistrationStep ? "Complete Registration" : "Create User"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="flex items-center justify-between">
        <Tabs defaultValue="all" className="w-fit" onValueChange={setCurrentTab}>
          <TabsList>
            <TabsTrigger value="all">All Users</TabsTrigger>
            <TabsTrigger value="student">Students</TabsTrigger>
            <TabsTrigger value="teacher">Teachers</TabsTrigger>
            <TabsTrigger value="admin">Admins</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="relative w-64">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="flex justify-center items-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    Loading users...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="flex justify-end gap-2">
                    <Dialog open={isEditUserOpen && selectedUser?.id === user.id} onOpenChange={(open) => {
                      setIsEditUserOpen(open);
                      if (open) handleEditClick(user);
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => {
                          handleEditClick(user);
                        }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit User</DialogTitle>
                          <DialogDescription>
                            Update user information
                          </DialogDescription>
                        </DialogHeader>
                        
                        {selectedUser && (
                          <div className="grid grid-cols-2 gap-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-name">Full Name</Label>
                              <Input 
                                id="edit-name" 
                                value={selectedUser.name}
                                onChange={e => setSelectedUser({...selectedUser, name: e.target.value})}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="edit-email">Email</Label>
                              <Input 
                                id="edit-email" 
                                type="email"
                                value={selectedUser.email}
                                onChange={e => setSelectedUser({...selectedUser, email: e.target.value})}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="edit-role">Role</Label>
                              <Select 
                                value={selectedUser.role} 
                                onValueChange={value => setSelectedUser({...selectedUser, role: value})}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="STUDENT">Student</SelectItem>
                                  <SelectItem value="TEACHER">Teacher</SelectItem>
                                  <SelectItem value="ADMIN">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="edit-password">Password</Label>
                              <div className="relative">
                                <Input 
                                  id="edit-password" 
                                  type={showPassword ? "text" : "password"}
                                  placeholder="New password (leave empty to keep current)"
                                  onChange={e => {
                                    const updatedUser = { ...selectedUser };
                                    if (selectedUser) {
                                      updatedUser.password = e.target.value;
                                      setSelectedUser(updatedUser);
                                    }
                                  }}
                                />
                                <button 
                                  type="button"
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                  onClick={() => setShowPassword(!showPassword)}
                                >
                                  {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                      <line x1="1" y1="1" x2="23" y2="23" />
                                    </svg>
                                  ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                      <circle cx="12" cy="12" r="3" />
                                    </svg>
                                  )}
                                </button>
                              </div>
                            </div>

                            {selectedUser.role === "STUDENT" && (
                              <div className="space-y-2 col-span-2">
                                <Label htmlFor="edit-class">Assign to Class</Label>
                                <Select
                                  value={selectedUser.classId || ""}
                                  onValueChange={value => setSelectedUser({...selectedUser, classId: value})}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select class" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {classes.map(cls => (
                                      <SelectItem key={cls.id} value={cls.id}>
                                        Grade {cls.grade} - Section {cls.section}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            <div className="space-y-2 col-span-2 mt-4">
                              <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => {
                                  if (selectedUser) {
                                    // Toggle facial recognition card/dialog
                                    setEditFaceRegistered(false); // Reset the state
                                    
                                    // Navigate to the facial recognition tab by clicking the button
                                    document.getElementById("facial-recognition-tab")?.click();
                                  }
                                }}
                              >
                                Update Facial Recognition
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        <Tabs defaultValue="details" className="mt-6">
                          <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="details">User Details</TabsTrigger>
                            <TabsTrigger 
                              id="qrcode-tab"
                              value="qrcode"
                              disabled={!selectedUser || !selectedUser.id}
                            >
                              QR Code
                            </TabsTrigger>
                            <TabsTrigger 
                              id="facial-recognition-tab"
                              value="facial-recognition"
                              disabled={!selectedUser || !selectedUser.id}
                            >
                              Facial Recognition
                            </TabsTrigger>
                          </TabsList>

                          <TabsContent value="details">
                            {/* Details content is now handled above */}
                          </TabsContent>

                          <TabsContent value="qrcode">
                            {selectedUser && selectedUser.id && (
                              <Card>
                                <CardHeader>
                                  <CardTitle>User QR Code</CardTitle>
                                  <CardDescription>
                                    View or generate QR code for this user
                                  </CardDescription>
                                </CardHeader>
                                <CardContent>
                                  {selectedUser.qrCode ? (
                                    <QRCodeGenerator 
                                      qrCodeData={selectedUser.qrCode}
                                      userName={selectedUser.name}
                                    />
                                  ) : (
                                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                                      <QrCode className="h-16 w-16 text-primary/30" />
                                      <p className="text-muted-foreground">No QR code available for this user</p>
                                      <Button 
                                        onClick={async () => {
                                          try {
                                            const qrResponse = await fetch('/api/auth/generate-qr', {
                                              method: 'POST',
                                              headers: {
                                                'Content-Type': 'application/json',
                                              },
                                              body: JSON.stringify({ userId: selectedUser.id }),
                                            });
                                            
                                            if (qrResponse.ok) {
                                              const qrData = await qrResponse.json();
                                              setSelectedUser({
                                                ...selectedUser,
                                                qrCode: qrData.qrCodeData
                                              });
                                              toast({
                                                title: "Success",
                                                description: "QR code generated successfully",
                                              });
                                            } else {
                                              throw new Error('Failed to generate QR code');
                                            }
                                          } catch (error) {
                                            console.error('Error:', error);
                                            toast({
                                              variant: "destructive",
                                              title: "Error",
                                              description: "Failed to generate QR code. Please try again.",
                                            });
                                          }
                                        }}
                                      >
                                        Generate QR Code
                                      </Button>
                                    </div>
                                  )}
                                </CardContent>
                                {selectedUser.qrCode && (
                                  <CardFooter className="justify-between">
                                    <p className="text-sm text-green-500">QR code available</p>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={async () => {
                                        try {
                                          const qrResponse = await fetch('/api/auth/generate-qr', {
                                            method: 'POST',
                                            headers: {
                                              'Content-Type': 'application/json',
                                            },
                                            body: JSON.stringify({ userId: selectedUser.id }),
                                          });
                                          
                                          if (qrResponse.ok) {
                                            const qrData = await qrResponse.json();
                                            setSelectedUser({
                                              ...selectedUser,
                                              qrCode: qrData.qrCodeData
                                            });
                                            toast({
                                              title: "Success",
                                              description: "QR code regenerated successfully",
                                            });
                                          } else {
                                            throw new Error('Failed to regenerate QR code');
                                          }
                                        } catch (error) {
                                          console.error('Error:', error);
                                          toast({
                                            variant: "destructive",
                                            title: "Error",
                                            description: "Failed to regenerate QR code. Please try again.",
                                          });
                                        }
                                      }}
                                    >
                                      Regenerate QR Code
                                    </Button>
                                  </CardFooter>
                                )}
                              </Card>
                            )}
                          </TabsContent>

                          <TabsContent value="facial-recognition">
                            {selectedUser && selectedUser.id && (
                              <Card>
                                <CardHeader>
                                  <CardTitle>Update Face Recognition</CardTitle>
                                  <CardDescription>
                                    Register or update facial recognition for this user
                                  </CardDescription>
                                </CardHeader>
                                <CardContent>
                                  <FacialRecognition 
                                    mode="registration"
                                    userId={selectedUser.id}
                                    onRecognized={() => setEditFaceRegistered(true)}
                                  />
                                </CardContent>
                                <CardFooter>
                                  {editFaceRegistered ? (
                                    <p className="text-sm text-green-500">Face registered successfully!</p>
                                  ) : (
                                    <p className="text-sm text-muted-foreground">
                                      Position your face within the frame and click "Register Face"
                                    </p>
                                  )}
                                </CardFooter>
                              </Card>
                            )}
                          </TabsContent>
                        </Tabs>
                        
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsEditUserOpen(false)}>Cancel</Button>
                          <Button onClick={handleUpdateUser}>Save Changes</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    
                    <Dialog open={isDeleteUserOpen && selectedUser?.id === user.id} onOpenChange={(open) => {
                      setIsDeleteUserOpen(open);
                      if (open) setSelectedUser(user);
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => {
                          setSelectedUser(user);
                          setIsDeleteUserOpen(true);
                        }}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete User</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to delete this user? This action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        
                        {selectedUser && (
                          <div className="py-4">
                            <p>You are about to delete <strong>{selectedUser.name}</strong>.</p>
                          </div>
                        )}
                        
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsDeleteUserOpen(false)}>Cancel</Button>
                          <Button variant="destructive" onClick={handleDeleteUser}>Delete</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}