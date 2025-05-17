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
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, CalendarIcon, FileDown, MoreHorizontal, Check, X, Clock, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

// Student interface for type checking
interface Student {
  id: string;
  name: string;
  email: string;
  role: string;
  class: {
    id: string;
    grade: number;
    section: string;
  } | null;
}

// Attendance record interface
interface AttendanceRecord {
  id: string;
  userId: string;
  status: string;
  timeIn: string | null;
  date: string;
  user: Student;
}

export function ClassAttendance() {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isEditStatusOpen, setIsEditStatusOpen] = useState(false);
  const [teacherClasses, setTeacherClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [currentTeacher, setCurrentTeacher] = useState<any>(null);

  // Fetch current teacher data and their assigned classes
  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        setIsLoading(true);
        
        // In a real app, this would get the current logged-in teacher from the session
        // For now, we'll fetch all teachers and use the first one for demo purposes
        const teachersResponse = await fetch('/api/users?role=TEACHER');
        if (!teachersResponse.ok) {
          throw new Error('Failed to fetch teacher data');
        }
        
        const teachersData = await teachersResponse.json();
        if (teachersData.users.length === 0) {
          throw new Error('No teachers found');
        }
        
        // Use the first teacher for demo purposes
        const teacher = teachersData.users[0];
        setCurrentTeacher(teacher);
        
        // Fetch classes for this teacher
        const classesResponse = await fetch(`/api/classes?teacherId=${teacher.id}`);
        if (!classesResponse.ok) {
          throw new Error('Failed to fetch classes');
        }
        
        const classesData = await classesResponse.json();
        setTeacherClasses(classesData.classes);
        
        // Set first class as selected by default
        if (classesData.classes.length > 0 && !selectedClass) {
          setSelectedClass(classesData.classes[0].id);
        }
      } catch (error) {
        console.error('Error fetching teacher data:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load teacher data. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeacherData();
  }, [toast]);

  // Fetch students and attendance when class or date is changed
  useEffect(() => {
    const fetchStudentsAndAttendance = async () => {
      if (!selectedClass) return;
      
      try {
        setIsLoading(true);
        
        // Fetch students for the selected class
        const studentsResponse = await fetch(`/api/users?role=STUDENT`);
        if (!studentsResponse.ok) {
          throw new Error('Failed to fetch students');
        }
        
        const studentsData = await studentsResponse.json();
        const classStudents = studentsData.users.filter((user: Student) => 
          user.class && user.class.id === selectedClass
        );
        setStudents(classStudents);
        
        // Fetch attendance records for this class and date
        const formattedDate = format(selectedDate, 'yyyy-MM-dd');
        const attendanceResponse = await fetch(
          `/api/attendance?classId=${selectedClass}&date=${formattedDate}`
        );
        
        if (!attendanceResponse.ok) {
          throw new Error('Failed to fetch attendance records');
        }
        
        const attendanceData = await attendanceResponse.json();
        setAttendanceRecords(attendanceData.attendance);
        
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

    fetchStudentsAndAttendance();
  }, [selectedClass, selectedDate, toast]);

  const getAttendanceForStudent = (studentId: string) => {
    return attendanceRecords.find(record => record.userId === studentId);
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedStudent) return;
    
    try {
      const timeIn = status !== "ABSENT" ? format(new Date(), "hh:mm a") : null;
      
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedStudent.id,
          date: selectedDate,
          status,
          timeIn,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update attendance');
      }

      const data = await response.json();
      
      // Update attendance records in state
      setAttendanceRecords(current => {
        const exists = current.some(record => record.userId === selectedStudent.id);
        if (exists) {
          return current.map(record => 
            record.userId === selectedStudent.id ? data.attendance : record
          );
        } else {
          return [...current, data.attendance];
        }
      });
      
      setIsEditStatusOpen(false);
      
      toast({
        title: "Success",
        description: "Attendance updated successfully",
      });
    } catch (error) {
      console.error('Error updating attendance:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update attendance",
      });
    }
  };

  const exportToExcel = () => {
    // In a real application, this would generate and download an Excel file
    alert("This would download an Excel export of the current attendance data");
  };

  const exportToPDF = () => {
    // In a real application, this would generate and download a PDF file
    alert("This would download a PDF export of the current attendance data");
  };

  const filteredStudents = students.filter(student => {
    // Filter by search term (name)
    if (searchTerm && !student.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  // Get the selected class details
  const selectedClassDetails = teacherClasses.find(cls => cls.id === selectedClass);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Class Attendance</h2>
          <p className="text-muted-foreground">
            {selectedClassDetails 
              ? `Grade ${selectedClassDetails.grade} - Section ${selectedClassDetails.section}` 
              : "Select a class"}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {teacherClasses.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex items-center">
                  <span className="mr-2">
                    {selectedClassDetails 
                      ? `Grade ${selectedClassDetails.grade} - Section ${selectedClassDetails.section}` 
                      : "Select Class"}
                  </span>
                  <CalendarIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <div className="p-2">
                  {teacherClasses.map(cls => (
                    <Button
                      key={cls.id}
                      variant={selectedClass === cls.id ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setSelectedClass(cls.id)}
                    >
                      Grade {cls.grade} - Section {cls.section}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center">
                <span className="mr-2">{format(selectedDate, "MMM dd, yyyy")}</span>
                <CalendarIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Button onClick={exportToExcel} variant="outline" size="sm" className="flex items-center">
            <FileDown className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
          <Button onClick={exportToPDF} variant="outline" size="sm" className="flex items-center">
            <FileDown className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Attendance Record</CardTitle>
          <CardDescription>
            {format(selectedDate, "EEEE, MMMM do, yyyy")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time In</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <div className="flex justify-center items-center">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      Loading students...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((student) => {
                  const attendanceRecord = getAttendanceForStudent(student.id);
                  const status = attendanceRecord?.status || "Not Marked";
                  const timeIn = attendanceRecord?.timeIn || "-";
                  
                  return (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>
                        <span className={
                          status === "PRESENT" ? "text-green-600" :
                          status === "ABSENT" ? "text-red-600" :
                          status === "LATE" ? "text-amber-600" :
                          "text-gray-500"
                        }>
                          {status === "PRESENT" ? "Present" :
                           status === "ABSENT" ? "Absent" :
                           status === "LATE" ? "Late" : "Not Marked"}
                        </span>
                      </TableCell>
                      <TableCell>{timeIn}</TableCell>
                      <TableCell className="text-right">
                        <Dialog open={isEditStatusOpen && selectedStudent?.id === student.id} onOpenChange={(open) => {
                          setIsEditStatusOpen(open);
                          if (open) setSelectedStudent(student);
                        }}>
                          <DialogTrigger asChild>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  setSelectedStudent(student);
                                  setIsEditStatusOpen(true);
                                }}>
                                  Edit Status
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Update Attendance Status</DialogTitle>
                              <DialogDescription>
                                Change the attendance status for {selectedStudent?.name}
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="grid grid-cols-3 gap-4 py-4">
                              <Button
                                variant="outline"
                                className="flex flex-col items-center justify-center h-24 p-2"
                                onClick={() => handleUpdateStatus("PRESENT")}
                              >
                                <Check className="h-8 w-8 mb-2 text-green-600" />
                                <span>Present</span>
                              </Button>
                              
                              <Button
                                variant="outline"
                                className="flex flex-col items-center justify-center h-24 p-2"
                                onClick={() => handleUpdateStatus("ABSENT")}
                              >
                                <X className="h-8 w-8 mb-2 text-red-600" />
                                <span>Absent</span>
                              </Button>
                              
                              <Button
                                variant="outline"
                                className="flex flex-col items-center justify-center h-24 p-2"
                                onClick={() => handleUpdateStatus("LATE")}
                              >
                                <Clock className="h-8 w-8 mb-2 text-amber-600" />
                                <span>Late</span>
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No students found for this class
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}