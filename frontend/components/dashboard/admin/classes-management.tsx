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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Pencil, PlusCircle, Trash2, Search, GraduationCap, Users, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Interfaces for TypeScript
interface Teacher {
  id: string;
  name: string;
  email: string;
}

interface Class {
  id: string;
  grade: number;
  section: string;
  teacherId: string | null;
  teacher: Teacher | null;
  createdAt: string;
  updatedAt: string;
}

export function ClassesManagement() {
  const { toast } = useToast();
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentTab, setCurrentTab] = useState<number | null>(null);
  const [newClass, setNewClass] = useState({
    grade: "",
    section: "",
    teacherId: "",
  });
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [isEditClassOpen, setIsEditClassOpen] = useState(false);
  const [isDeleteClassOpen, setIsDeleteClassOpen] = useState(false);
  const [isViewStudentsOpen, setIsViewStudentsOpen] = useState(false);
  const [classStudents, setClassStudents] = useState<any[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  // Fetch classes and teachers
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch classes
        const classesResponse = await fetch('/api/classes');
        if (!classesResponse.ok) {
          throw new Error('Failed to fetch classes');
        }
        const classesData = await classesResponse.json();
        setClasses(classesData.classes);
        
        // Fetch teachers (users with TEACHER role)
        const teachersResponse = await fetch('/api/users?role=TEACHER');
        if (!teachersResponse.ok) {
          throw new Error('Failed to fetch teachers');
        }
        const teachersData = await teachersResponse.json();
        setTeachers(teachersData.users);
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

  const filteredClasses = classes.filter(cls => {
    // Filter by grade tab
    if (currentTab !== null && cls.grade !== currentTab) {
      return false;
    }
    
    // Filter by search term (teacher name or section)
    const teacherName = cls.teacher?.name?.toLowerCase() || '';
    if (searchTerm && 
        !teacherName.includes(searchTerm.toLowerCase()) && 
        !`section ${cls.section}`.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  const handleAddClass = async () => {
    try {
      const response = await fetch('/api/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newClass),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create class');
      }

      const data = await response.json();
      setClasses([...classes, data.class]);
      setIsAddClassOpen(false);
      setNewClass({
        grade: "",
        section: "",
        teacherId: "",
      });

      toast({
        title: "Success",
        description: "Class added successfully",
      });
    } catch (error) {
      console.error('Error creating class:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add class",
      });
    }
  };

  const handleUpdateClass = async () => {
    if (!selectedClass) return;

    try {
      const response = await fetch(`/api/classes/${selectedClass.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grade: selectedClass.grade,
          section: selectedClass.section,
          teacherId: selectedClass.teacherId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update class');
      }

      const data = await response.json();
      setClasses(classes.map(cls => (cls.id === selectedClass.id ? data.class : cls)));
      setIsEditClassOpen(false);

      toast({
        title: "Success",
        description: "Class updated successfully",
      });
    } catch (error) {
      console.error('Error updating class:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update class",
      });
    }
  };

  const handleDeleteClass = async () => {
    if (!selectedClass) return;

    try {
      const response = await fetch(`/api/classes/${selectedClass.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete class');
      }

      setClasses(classes.filter(cls => cls.id !== selectedClass.id));
      setIsDeleteClassOpen(false);

      toast({
        title: "Success",
        description: "Class deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting class:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete class",
      });
    }
  };

  const fetchStudentsForClass = async (classId: string) => {
    try {
      setIsLoadingStudents(true);
      
      // Fetch students with this classId
      const response = await fetch('/api/users?role=STUDENT');
      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }
      
      const data = await response.json();
      console.log("All students:", data.users); // Debug log
      
      const studentsInClass = data.users.filter((student: any) => student.classId === classId);
      console.log("Students in class:", studentsInClass, "Class ID:", classId); // Debug log
      
      setClassStudents(studentsInClass);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load students. Please try again.",
      });
    } finally {
      setIsLoadingStudents(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Classes Management</h2>
          <p className="text-muted-foreground">
            Manage all classes and sections
          </p>
        </div>
        
        <Dialog open={isAddClassOpen} onOpenChange={setIsAddClassOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Class
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Class</DialogTitle>
              <DialogDescription>
                Create a new class with grade, section, and assign a teacher
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="grade">Grade Level</Label>
                <Select 
                  value={newClass.grade} 
                  onValueChange={value => setNewClass({...newClass, grade: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map(grade => (
                      <SelectItem key={grade} value={grade.toString()}>
                        Grade {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="section">Section</Label>
                <Select 
                  value={newClass.section} 
                  onValueChange={value => setNewClass({...newClass, section: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">Section A</SelectItem>
                    <SelectItem value="B">Section B</SelectItem>
                    <SelectItem value="C">Section C</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="teacher">Assign Teacher</Label>
                <Select 
                  value={newClass.teacherId} 
                  onValueChange={value => setNewClass({...newClass, teacherId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Teacher Assigned</SelectItem>
                    {teachers.map(teacher => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddClassOpen(false)}>Cancel</Button>
              <Button onClick={handleAddClass}>Add Class</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="flex items-center justify-between">
        <Tabs
          defaultValue="all"
          className="w-fit"
          onValueChange={(value) => setCurrentTab(value === "all" ? null : parseInt(value))}
        >
          <TabsList className="grid grid-cols-7">
            <TabsTrigger value="all">All</TabsTrigger>
            {[1, 2, 3, 4, 5, 6].map(grade => (
              <TabsTrigger key={grade} value={grade.toString()}>
                Grade {grade}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        
        <div className="relative w-64">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by teacher or section..."
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
              <TableHead>Grade</TableHead>
              <TableHead>Section</TableHead>
              <TableHead>Teacher</TableHead>
              <TableHead>Students</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="flex justify-center items-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    Loading classes...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredClasses.length > 0 ? (
              filteredClasses.map((cls) => (
                <TableRow key={cls.id}>
                  <TableCell>Grade {cls.grade}</TableCell>
                  <TableCell>Section {cls.section}</TableCell>
                  <TableCell>{cls.teacher?.name || "No Teacher Assigned"}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="flex gap-1 items-center" onClick={() => {
                      setSelectedClass(cls);
                      setIsViewStudentsOpen(true);
                      fetchStudentsForClass(cls.id);
                    }}>
                      <Users className="h-3.5 w-3.5" />
                      <span>View</span>
                    </Button>
                  </TableCell>
                  <TableCell className="flex justify-end gap-2">
                    <Dialog open={isEditClassOpen && selectedClass?.id === cls.id} onOpenChange={(open) => {
                      setIsEditClassOpen(open);
                      if (open) setSelectedClass(cls);
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => {
                          setSelectedClass(cls);
                          setIsEditClassOpen(true);
                        }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Class</DialogTitle>
                          <DialogDescription>
                            Update class information
                          </DialogDescription>
                        </DialogHeader>
                        
                        {selectedClass && (
                          <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-grade">Grade Level</Label>
                              <Select 
                                value={selectedClass.grade.toString()} 
                                onValueChange={value => setSelectedClass({
                                  ...selectedClass, 
                                  grade: parseInt(value),
                                })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {[1, 2, 3, 4, 5, 6].map(grade => (
                                    <SelectItem key={grade} value={grade.toString()}>
                                      Grade {grade}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="edit-section">Section</Label>
                              <Select 
                                value={selectedClass.section} 
                                onValueChange={value => setSelectedClass({...selectedClass, section: value})}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="A">Section A</SelectItem>
                                  <SelectItem value="B">Section B</SelectItem>
                                  <SelectItem value="C">Section C</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="edit-teacher">Assign Teacher</Label>
                              <Select 
                                value={selectedClass.teacherId || ""} 
                                onValueChange={value => setSelectedClass({
                                  ...selectedClass, 
                                  teacherId: value || null,
                                })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="">No Teacher Assigned</SelectItem>
                                  {teachers.map(teacher => (
                                    <SelectItem key={teacher.id} value={teacher.id}>
                                      {teacher.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )}
                        
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsEditClassOpen(false)}>Cancel</Button>
                          <Button onClick={handleUpdateClass}>Save Changes</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    
                    <Dialog open={isDeleteClassOpen && selectedClass?.id === cls.id} onOpenChange={(open) => {
                      setIsDeleteClassOpen(open);
                      if (open) setSelectedClass(cls);
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => {
                          setSelectedClass(cls);
                          setIsDeleteClassOpen(true);
                        }}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete Class</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to delete this class? This action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        
                        {selectedClass && (
                          <div className="py-4">
                            <p>You are about to delete <strong>Grade {selectedClass.grade} - Section {selectedClass.section}</strong>.</p>
                          </div>
                        )}
                        
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsDeleteClassOpen(false)}>Cancel</Button>
                          <Button variant="destructive" onClick={handleDeleteClass}>Delete</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No classes found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <Dialog open={isViewStudentsOpen} onOpenChange={setIsViewStudentsOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>
              {selectedClass ? `Students in Grade ${selectedClass.grade} - Section ${selectedClass.section}` : 'Students'}
            </DialogTitle>
            <DialogDescription>
              View all students enrolled in this class
            </DialogDescription>
          </DialogHeader>
          
          <Card>
            <CardHeader>
              <CardTitle>Class Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Grade</p>
                  <p className="font-medium">{selectedClass?.grade}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Section</p>
                  <p className="font-medium">{selectedClass?.section}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Teacher</p>
                  <p className="font-medium">{selectedClass?.teacher?.name || "No Teacher Assigned"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {isLoadingStudents ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading students...</span>
            </div>
          ) : classStudents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classStudents.map(student => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.email}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-4">
              <p className="text-center text-muted-foreground">
                No students are currently assigned to this class.
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setIsViewStudentsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}