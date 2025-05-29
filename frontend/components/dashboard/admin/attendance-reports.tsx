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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { AttendanceChart } from "./attendance-chart";
import { Search, FileDown, Calendar as CalendarIcon, Filter, Loader2, Users, GraduationCap } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

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
    role: string;
    class?: {
      id: string;
      grade: number;
      section: string;
    } | null;
  };
}

export function AttendanceReports() {
  const { toast } = useToast();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [filterGrade, setFilterGrade] = useState<string | null>(null);
  const [filterSection, setFilterSection] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [userTypeTab, setUserTypeTab] = useState("students");
  
  // Fetch attendance records from the database
  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        setIsLoading(true);
        
        // Build query string for date
        let queryString = '';
        if (selectedDate) {
          const formattedDate = format(selectedDate, 'yyyy-MM-dd');
          queryString = `?date=${formattedDate}`;
        }
        
        const response = await fetch(`/api/attendance${queryString}`);
        if (!response.ok) {
          throw new Error('Failed to fetch attendance data');
        }
        
        const data = await response.json();
        setAttendanceRecords(data.attendance);
      } catch (error) {
        console.error('Error fetching attendance data:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load attendance data. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAttendanceData();
  }, [selectedDate, toast]);
  
  // Filter records by user type (students or teachers)
  const getFilteredAttendance = (userType: 'STUDENT' | 'TEACHER') => {
    return attendanceRecords
      .filter(record => record.user.role === userType)
      .filter(record => {
        // Filter by search term (name)
        if (searchTerm && !record.user.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }
        
        // For students, filter by grade and section
        if (userType === 'STUDENT') {
          if (filterGrade && record.user.class && record.user.class.grade !== parseInt(filterGrade)) {
            return false;
          }
          
          if (filterSection && record.user.class && record.user.class.section !== filterSection) {
            return false;
          }
        }
        
        // Filter by status
        const statusMap: Record<string, string> = {
          "Present": "PRESENT",
          "Absent": "ABSENT",
          "Late": "LATE"
        };
        if (filterStatus && record.status !== statusMap[filterStatus]) {
          return false;
        }
        
        return true;
      });
  };

  const exportToExcel = () => {
    // In a real application, this would generate and download an Excel file
    alert("This would download an Excel export of the current filtered attendance data");
  };

  const exportToPDF = () => {
    // In a real application, this would generate and download a PDF file
    alert("This would download a PDF export of the current filtered attendance data");
  };

  const renderAttendanceTable = (userType: 'STUDENT' | 'TEACHER') => {
    const filteredAttendance = getFilteredAttendance(userType);

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Showing {filteredAttendance.length} {userType.toLowerCase()} attendance records
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToExcel}>
              <FileDown className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button variant="outline" onClick={exportToPDF}>
              <FileDown className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>
        
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  {userType === 'STUDENT' && <TableHead>Class</TableHead>}
                  <TableHead>Status</TableHead>
                  <TableHead>Time In</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={userType === 'STUDENT' ? 5 : 4} className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredAttendance.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={userType === 'STUDENT' ? 5 : 4} className="text-center py-8">
                      No attendance records found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAttendance.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.user.name}</TableCell>
                      {userType === 'STUDENT' && (
                        <TableCell>
                          {record.user.class 
                            ? `Grade ${record.user.class.grade} - ${record.user.class.section}`
                            : 'No Class'
                          }
                        </TableCell>
                      )}
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          record.status === 'PRESENT' ? 'bg-green-100 text-green-800' :
                          record.status === 'ABSENT' ? 'bg-red-100 text-red-800' :
                          record.status === 'LATE' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {record.status === 'PRESENT' ? 'Present' :
                           record.status === 'ABSENT' ? 'Absent' :
                           record.status === 'LATE' ? 'Late' :
                           record.status}
                        </span>
                      </TableCell>
                      <TableCell>{record.timeIn || '-'}</TableCell>
                      <TableCell>{format(new Date(record.date), 'MMM dd, yyyy')}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Attendance Reports</h2>
        <p className="text-muted-foreground">
          View and export attendance records for students and teachers
        </p>
      </div>
      
      <Tabs defaultValue="students" value={userTypeTab} onValueChange={setUserTypeTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="students" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Students
          </TabsTrigger>
          <TabsTrigger value="teachers" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Teachers
          </TabsTrigger>
        </TabsList>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="min-w-[240px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
              />
            </PopoverContent>
          </Popover>
          
          {userTypeTab === "students" && (
            <>
              <Select value={filterGrade || ""} onValueChange={(value) => setFilterGrade(value === "all-grades" ? null : value)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-grades">All Grades</SelectItem>
                  {[1, 2, 3, 4, 5, 6].map(grade => (
                    <SelectItem key={grade} value={grade.toString()}>
                      Grade {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filterSection || ""} onValueChange={(value) => setFilterSection(value === "all-sections" ? null : value)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-sections">All Sections</SelectItem>
                  <SelectItem value="A">Section A</SelectItem>
                  <SelectItem value="B">Section B</SelectItem>
                  <SelectItem value="C">Section C</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}
          
          <Select value={filterStatus || ""} onValueChange={(value) => setFilterStatus(value === "all-status" ? null : value)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-status">All Status</SelectItem>
              <SelectItem value="Present">Present</SelectItem>
              <SelectItem value="Absent">Absent</SelectItem>
              <SelectItem value="Late">Late</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <TabsContent value="students">
          {renderAttendanceTable('STUDENT')}
        </TabsContent>
        
        <TabsContent value="teachers">
          {renderAttendanceTable('TEACHER')}
        </TabsContent>
      </Tabs>
    </div>
  );
}