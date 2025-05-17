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
import { UserPlus, Pencil, Trash2, Search, Loader2 } from "lucide-react";
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
}

// Class interface
interface ClassOption {
  id: string;
  grade: number;
  section: string;
}

export function UsersManagement() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentTab, setCurrentTab] = useState("all");
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "STUDENT",
    password: "",
    classId: "",
  });
  const [faceRegistered, setFaceRegistered] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isDeleteUserOpen, setIsDeleteUserOpen] = useState(false);

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

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create user');
      }

      const data = await response.json();
      setUsers([...users, data.user]);
      setIsAddUserOpen(false);
      setNewUser({
        name: "",
        email: "",
        role: "STUDENT",
        password: "",
        classId: "",
      });
      setFaceRegistered(false);

      toast({
        title: "Success",
        description: "User added successfully",
      });
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add user",
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
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Create a new user account and add them to the system
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="details" className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">User Details</TabsTrigger>
                <TabsTrigger value="face" disabled={newUser.name === ""}>
                  Facial Recognition
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
                      placeholder="Enter email address" 
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
                    <Input 
                      id="password" 
                      type="password" 
                      value={newUser.password}
                      onChange={e => setNewUser({...newUser, password: e.target.value})}
                      placeholder="Enter password" 
                    />
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
              
              <TabsContent value="face">
                <Card>
                  <CardHeader>
                    <CardTitle>Register Face</CardTitle>
                    <CardDescription>
                      Capture a clear image of the user's face for recognition
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FacialRecognition 
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
              </TabsContent>
            </Tabs>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>Cancel</Button>
              <Button onClick={handleAddUser}>Add User</Button>
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
                      if (open) setSelectedUser(user);
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => {
                          setSelectedUser(user);
                          setIsEditUserOpen(true);
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
                              <Input 
                                id="edit-password" 
                                type="password" 
                                placeholder="New password (leave empty to keep current)"
                                onChange={e => {
                                  const updatedUser = { ...selectedUser };
                                  if (selectedUser) {
                                    updatedUser.password = e.target.value;
                                    setSelectedUser(updatedUser);
                                  }
                                }}
                              />
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
                          </div>
                        )}
                        
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