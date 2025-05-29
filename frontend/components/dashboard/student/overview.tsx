"use client"

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { UserCheck, Calendar as CalendarIcon, Clock, Loader2, GraduationCap } from "lucide-react";
import { StudentAttendanceChart } from "./student-attendance-chart";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

// Interface for attendance records
interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  timeIn: string | null;
  userId: string;
}

// Interface for student
interface Student {
  id: string;
  name: string;
  email: string;
  class: {
    id: string;
    grade: number;
    section: string;
    teacher?: {
      id: string;
      name: string;
      email: string;
    } | null;
  } | null;
}

export function StudentOverview() {
  const { toast } = useToast();
  const [date, setDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [student, setStudent] = useState<Student | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [teacherAttendance, setTeacherAttendance] = useState<AttendanceRecord | null>(null);
  
  // Fetch the current student's data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // In a real app, we would get the current user's ID from the session
        // For now, we'll get the first student in the database
        const studentsResponse = await fetch('/api/users?role=STUDENT');
        if (!studentsResponse.ok) {
          throw new Error('Failed to fetch student data');
        }
        
        const studentsData = await studentsResponse.json();
        if (studentsData.users.length === 0) {
          throw new Error('No student found');
        }
        
        // Use the first student for demo purposes
        const currentStudent = studentsData.users[0];
        console.log('Current student with class data:', currentStudent);
        setStudent(currentStudent);
        
        // Fetch the student's attendance records
        const attendanceResponse = await fetch(`/api/attendance?userId=${currentStudent.id}`);
        if (!attendanceResponse.ok) {
          throw new Error('Failed to fetch attendance records');
        }
        
        const attendanceData = await attendanceResponse.json();
        setAttendanceHistory(attendanceData.attendance);
        
        // Find today's attendance record
        const today = new Date();
        const formattedToday = format(today, 'yyyy-MM-dd');
        const todayRecord = attendanceData.attendance.find((record: AttendanceRecord) => 
          record.date.startsWith(formattedToday)
        );
        
        setTodayAttendance(todayRecord || null);
        
        // Fetch teacher's attendance if student has a class with teacher
        if (currentStudent.class && currentStudent.class.teacher) {
          console.log('Found teacher info:', currentStudent.class.teacher);
          try {
            const teacherAttendanceResponse = await fetch(`/api/attendance?userId=${currentStudent.class.teacher.id}&date=${formattedToday}`);
            if (teacherAttendanceResponse.ok) {
              const teacherAttendanceData = await teacherAttendanceResponse.json();
              console.log('Teacher attendance data:', teacherAttendanceData);
              const teacherTodayRecord = teacherAttendanceData.attendance.find((record: AttendanceRecord) => 
                record.date.startsWith(formattedToday)
              );
              console.log('Teacher today record:', teacherTodayRecord);
              setTeacherAttendance(teacherTodayRecord || null);
            } else {
              console.log('Failed to fetch teacher attendance:', teacherAttendanceResponse.status);
            }
          } catch (teacherError) {
            console.error('Error fetching teacher attendance:', teacherError);
          }
        } else {
          console.log('No teacher found for student class:', currentStudent.class);
        }
        
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load student data. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [toast]);
  
  // Calculate attendance statistics
  const presentCount = attendanceHistory.filter(record => record.status === 'PRESENT').length;
  const absentCount = attendanceHistory.filter(record => record.status === 'ABSENT').length;
  const lateCount = attendanceHistory.filter(record => record.status === 'LATE').length;
  const totalDays = attendanceHistory.length;
  const attendanceRate = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0;
  
  // Calculate average time in (for present and late days)
  const timeInRecords = attendanceHistory
    .filter(record => record.status !== 'ABSENT' && record.timeIn)
    .map(record => record.timeIn as string);
  
  const getAverageTimeIn = () => {
    if (timeInRecords.length === 0) return "N/A";
    
    // This is a simplified calculation - in a real app, you'd convert to minutes and average
    return timeInRecords[Math.floor(timeInRecords.length / 2)];
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">My Attendance</h2>
        <p className="text-muted-foreground">
          Welcome {student?.name}, {student?.class ? `Grade ${student.class.grade} - Section ${student.class.section}` : 'No class assigned'}
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Today's Status
            </CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              todayAttendance?.status === 'PRESENT' ? 'text-green-600' :
              todayAttendance?.status === 'ABSENT' ? 'text-red-600' :
              todayAttendance?.status === 'LATE' ? 'text-amber-600' :
              'text-gray-500'
            }`}>
              {todayAttendance?.status === 'PRESENT' ? 'Present' :
               todayAttendance?.status === 'ABSENT' ? 'Absent' :
               todayAttendance?.status === 'LATE' ? 'Late' :
               'Not Marked'}
            </div>
            <p className="text-xs text-muted-foreground">
              {todayAttendance?.timeIn ? `Checked in at ${todayAttendance.timeIn}` : 'No check-in recorded'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Teacher Status
            </CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              teacherAttendance?.status === 'PRESENT' ? 'text-green-600' :
              teacherAttendance?.status === 'ABSENT' ? 'text-red-600' :
              teacherAttendance?.status === 'LATE' ? 'text-amber-600' :
              'text-gray-500'
            }`}>
              {teacherAttendance?.status === 'PRESENT' ? 'Present' :
               teacherAttendance?.status === 'ABSENT' ? 'Absent' :
               teacherAttendance?.status === 'LATE' ? 'Late' :
               'Not Marked'}
            </div>
            <p className="text-xs text-muted-foreground">
              {student?.class?.teacher ? student.class.teacher.name : 'No teacher assigned'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Monthly Attendance
            </CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceRate}%</div>
            <p className="text-xs text-muted-foreground">
              {presentCount}/{totalDays} days present
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Time In
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getAverageTimeIn()}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Absences
            </CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{absentCount}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Attendance Calendar</CardTitle>
            <CardDescription>
              View your attendance for each day
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={(date) => date && setDate(date)}
              className="rounded-md border"
              modifiers={{
                present: attendanceHistory
                  .filter(day => day.status === "PRESENT")
                  .map(day => new Date(day.date)),
                absent: attendanceHistory
                  .filter(day => day.status === "ABSENT")
                  .map(day => new Date(day.date)),
                late: attendanceHistory
                  .filter(day => day.status === "LATE")
                  .map(day => new Date(day.date)),
              }}
              modifiersStyles={{
                present: { color: "white", backgroundColor: "hsl(142.1, 76.2%, 36.3%)" },
                absent: { color: "white", backgroundColor: "hsl(0, 84.2%, 60.2%)" },
                late: { color: "white", backgroundColor: "hsl(38, 92%, 50%)" },
              }}
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Monthly Attendance Trend</CardTitle>
            <CardDescription>
              Your attendance pattern this school year
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <StudentAttendanceChart attendanceRecords={attendanceHistory} />
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Attendance History</CardTitle>
          <CardDescription>
            Recent attendance records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time In</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceHistory.length > 0 ? (
                attendanceHistory.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{format(new Date(record.date), 'yyyy-MM-dd')}</TableCell>
                    <TableCell>
                      <span className={
                        record.status === "PRESENT" ? "text-green-600" :
                        record.status === "ABSENT" ? "text-red-600" :
                        "text-amber-600"
                      }>
                        {record.status === "PRESENT" ? "Present" :
                        record.status === "ABSENT" ? "Absent" : "Late"}
                      </span>
                    </TableCell>
                    <TableCell>{record.timeIn || "-"}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    No attendance records found
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