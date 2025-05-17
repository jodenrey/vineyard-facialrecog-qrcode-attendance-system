"use client"

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AreaChart, Users, UserCheck, UserX, Loader2 } from "lucide-react";
import { ClassAttendanceChart } from "./class-attendance-chart";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

// Interface for teacher data
interface Teacher {
  id: string;
  name: string;
  email: string;
  teacherClasses: any[];
}

// Interface for attendance records
interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  timeIn: string | null;
  userId: string;
  user: {
    id: string;
    name: string;
    class?: {
      id: string;
      grade: number;
      section: string;
    } | null;
  };
}

export function TeacherOverview() {
  const { toast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'MMM').toLowerCase());
  const [isLoading, setIsLoading] = useState(true);
  const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(null);
  const [teacherClasses, setTeacherClasses] = useState<any[]>([]);
  const [classStudents, setClassStudents] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceStats, setAttendanceStats] = useState({
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
    monthlyRate: 0
  });
  
  // Month data for tabs
  const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  // Fetch teacher data, classes, and students
  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        setIsLoading(true);
        
        // In a real app, this would get the current logged-in teacher from the session
        // For now, we'll fetch all teachers and use the first one for demo
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
        console.log("Current teacher data:", teacher); // Debug log
        setCurrentTeacher(teacher);
        
        // Fetch classes for this teacher
        const classesResponse = await fetch(`/api/classes?teacherId=${teacher.id}`);
        if (!classesResponse.ok) {
          throw new Error('Failed to fetch classes');
        }
        
        const classesData = await classesResponse.json();
        setTeacherClasses(classesData.classes);
        
        // If teacher has classes, fetch students in the first class
        if (classesData.classes.length > 0) {
          const classId = classesData.classes[0].id;
          
          // Fetch students for this class
          const studentsResponse = await fetch('/api/users?role=STUDENT');
          if (!studentsResponse.ok) {
            throw new Error('Failed to fetch students');
          }
          
          const studentsData = await studentsResponse.json();
          const studentsInClass = studentsData.users.filter((student: any) => 
            student.classId === classId
          );
          
          setClassStudents(studentsInClass);
          
          // Fetch today's attendance records
          const today = new Date();
          const formattedDate = format(today, 'yyyy-MM-dd');
          const attendanceResponse = await fetch(`/api/attendance?classId=${classId}&date=${formattedDate}`);
          
          if (!attendanceResponse.ok) {
            throw new Error('Failed to fetch attendance records');
          }
          
          const attendanceData = await attendanceResponse.json();
          setAttendanceRecords(attendanceData.attendance);
          
          // Calculate attendance stats
          const totalStudents = studentsInClass.length;
          const presentToday = attendanceData.attendance.filter(
            (record: any) => record.status === 'PRESENT'
          ).length;
          
          const lateToday = attendanceData.attendance.filter(
            (record: any) => record.status === 'LATE'
          ).length;
          
          const absentToday = totalStudents - presentToday - lateToday;
          
          // For monthly rate, we'd normally fetch a month's worth of data
          // For simplicity, we'll estimate based on today's data
          const monthlyRate = totalStudents > 0 
            ? Math.round(((presentToday + lateToday) / totalStudents) * 100)
            : 0;
          
          setAttendanceStats({
            totalStudents,
            presentToday: presentToday + lateToday,
            absentToday,
            monthlyRate
          });
        }
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
    
    fetchTeacherData();
  }, [toast]);
  
  // Function to get students with perfect attendance
  const getPerfectAttendanceStudents = () => {
    // In a real app, this would query for students with 100% attendance
    // For now, return a subset of students we have
    return classStudents.slice(0, 3);
  };
  
  // Function to get recently absent students
  const getRecentAbsentStudents = () => {
    // In a real app, this would query for students absent in the last week
    // For now, filter students who are absent today
    return classStudents.filter(student => {
      return !attendanceRecords.some(record => 
        record.userId === student.id && 
        (record.status === 'PRESENT' || record.status === 'LATE')
      );
    }).slice(0, 2);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  // Get class details for display
  const classDetails = teacherClasses.length > 0 
    ? `Grade ${teacherClasses[0].grade} - Section ${teacherClasses[0].section}`
    : "No class assigned";
  
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome to the teacher dashboard, {currentTeacher?.name ? currentTeacher.name : "Teacher"}
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Students
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceStats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              {classDetails}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Present Today
            </CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceStats.presentToday}</div>
            <p className="text-xs text-muted-foreground">
              {attendanceStats.totalStudents > 0 
                ? `${Math.round((attendanceStats.presentToday / attendanceStats.totalStudents) * 100)}% attendance` 
                : "No students"
              }
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Absent Today
            </CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceStats.absentToday}</div>
            <p className="text-xs text-muted-foreground">
              {attendanceStats.totalStudents > 0 
                ? `${Math.round((attendanceStats.absentToday / attendanceStats.totalStudents) * 100)}% of students` 
                : "No students"
              }
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Monthly Attendance
            </CardTitle>
            <AreaChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceStats.monthlyRate}%</div>
            <p className="text-xs text-muted-foreground">
              This month's average
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Class Attendance Overview</CardTitle>
          <CardDescription>
            Daily attendance records for {classDetails}
          </CardDescription>
          <Tabs
            value={selectedMonth}
            onValueChange={setSelectedMonth}
            className="mt-2"
          >
            <TabsList className="grid grid-cols-6 md:grid-cols-12">
              {months.map((month, index) => (
                <TabsTrigger key={month} value={month} className="text-xs">
                  {monthNames[index].substring(0, 3)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="h-80">
          <ClassAttendanceChart />
        </CardContent>
      </Card>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Absences</CardTitle>
            <CardDescription>
              Students who have been absent in the last week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getRecentAbsentStudents().length > 0 ? (
                getRecentAbsentStudents().map(student => (
                  <div key={student.id} className="flex items-center">
                    <div className="mr-4 h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserX className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{student.name}</p>
                      <p className="text-xs text-muted-foreground">Absent today</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No recent absences</p>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Perfect Attendance</CardTitle>
            <CardDescription>
              Students with 100% attendance this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getPerfectAttendanceStudents().length > 0 ? (
                getPerfectAttendanceStudents().map(student => (
                  <div key={student.id} className="flex items-center">
                    <div className="mr-4 h-9 w-9 rounded-full bg-green-100 flex items-center justify-center">
                      <UserCheck className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{student.name}</p>
                      <p className="text-xs text-muted-foreground">100% attendance</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No students with perfect attendance</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}