"use client"

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AreaChart, Layers, Users, UserCheck, Loader2 } from "lucide-react";
import { AttendanceChart } from "./attendance-chart";
import { useToast } from "@/hooks/use-toast";

// Dashboard stats interface
interface DashboardStats {
  studentCount: number;
  teacherCount: number;
  classCount: number;
  attendanceRate: number;
  isLoading: boolean;
}

export function AdminOverview() {
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    studentCount: 0,
    teacherCount: 0,
    classCount: 0,
    attendanceRate: 0,
    isLoading: true
  });
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch student count
        const studentResponse = await fetch('/api/users?role=STUDENT');
        const teacherResponse = await fetch('/api/users?role=TEACHER');
        const classResponse = await fetch('/api/classes');
        
        // Fetch attendance data for today
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        const attendanceResponse = await fetch(`/api/attendance?date=${formattedDate}`);

        if (!studentResponse.ok || !teacherResponse.ok || !classResponse.ok || !attendanceResponse.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const studentData = await studentResponse.json();
        const teacherData = await teacherResponse.json();
        const classData = await classResponse.json();
        const attendanceData = await attendanceResponse.json();
        
        // Calculate actual attendance rate
        const students = studentData.users;
        const attendanceRecords = attendanceData.attendance;
        
        let attendanceRate = 0;
        if (students.length > 0) {
          const presentCount = attendanceRecords.filter(
            (record: any) => record.status === 'PRESENT' || record.status === 'LATE'
          ).length;
          
          attendanceRate = Math.round((presentCount / students.length) * 100);
        }

        setStats({
          studentCount: studentData.users.length,
          teacherCount: teacherData.users.length,
          classCount: classData.classes.length,
          attendanceRate: attendanceRate,
          isLoading: false
        });
        
        // Set attendance records for charts
        setAttendanceRecords(attendanceData.attendance);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load dashboard data. Please try again.",
        });
        setStats(prev => ({ ...prev, isLoading: false }));
      }
    };

    fetchDashboardData();
  }, [toast]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome to the administration dashboard for Vineyard Christian Academy
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
            {stats.isLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading...</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.studentCount}</div>
                <p className="text-xs text-muted-foreground">
                  Students enrolled
                </p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Teachers
            </CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {stats.isLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading...</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.teacherCount}</div>
                <p className="text-xs text-muted-foreground">
                  Faculty members
                </p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Classes
            </CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {stats.isLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading...</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.classCount}</div>
                <p className="text-xs text-muted-foreground">
                  Grades 1-6
                </p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Attendance Rate
            </CardTitle>
            <AreaChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {stats.isLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading...</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.attendanceRate}%</div>
                <p className="text-xs text-muted-foreground">
                  Overall attendance
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="today" className="space-y-4">
        <TabsList>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="month">This Month</TabsTrigger>
        </TabsList>
        <TabsContent value="today" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Summary</CardTitle>
              <CardDescription>
                Overview of today's attendance across all grades
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <AttendanceChart attendanceRecords={attendanceRecords} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="week" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Summary</CardTitle>
              <CardDescription>
                Overview of this week's attendance across all grades
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <AttendanceChart attendanceRecords={attendanceRecords} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="month" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Summary</CardTitle>
              <CardDescription>
                Overview of this month's attendance across all grades
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <AttendanceChart attendanceRecords={attendanceRecords} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}