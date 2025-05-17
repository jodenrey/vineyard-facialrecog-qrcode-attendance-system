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
import { Search, FileDown, Calendar as CalendarIcon, Filter, Loader2 } from "lucide-react";
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
  
  const filteredAttendance = attendanceRecords.filter(record => {
    // Filter by search term (name)
    if (searchTerm && !record.user.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Filter by grade
    if (filterGrade && record.user.class && record.user.class.grade !== parseInt(filterGrade)) {
      return false;
    }
    
    // Filter by section
    if (filterSection && record.user.class && record.user.class.section !== filterSection) {
      return false;
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

  const exportToExcel = () => {
    // In a real application, this would generate and download an Excel file
    alert("This would download an Excel export of the current filtered attendance data");
  };

  const exportToPDF = () => {
    // In a real application, this would generate and download a PDF file
    alert("This would download a PDF export of the current filtered attendance data");
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Attendance Reports</h2>
        <p className="text-muted-foreground">
          View and export attendance records
        </p>
      </div>
      
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="chart">Chart View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="space-y-4">
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
            
            <Button variant="outline" onClick={() => {
              setSearchTerm("");
              setFilterGrade(null);
              setFilterSection(null);
              setFilterStatus(null);
            }}>
              Clear Filters
            </Button>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        Loading attendance records...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredAttendance.length > 0 ? (
                  filteredAttendance.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.user.name}</TableCell>
                      <TableCell>{record.user.class ? `Grade ${record.user.class.grade}` : "N/A"}</TableCell>
                      <TableCell>{record.user.class ? `Section ${record.user.class.section}` : "N/A"}</TableCell>
                      <TableCell>{format(new Date(record.date), 'yyyy-MM-dd')}</TableCell>
                      <TableCell>{record.timeIn || "-"}</TableCell>
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
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No attendance records found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={exportToExcel}>
              <FileDown className="mr-2 h-4 w-4" />
              Export Excel
            </Button>
            <Button variant="outline" onClick={exportToPDF}>
              <FileDown className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="chart" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Attendance by Grade</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <AttendanceChart attendanceRecords={filteredAttendance} date={selectedDate || new Date()} />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Weekly Attendance Trend</CardTitle>
              </CardHeader>
              <CardContent className="h-80 pt-4">
                <div className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground">Weekly trend visualization would appear here</p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Monthly Attendance Summary</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <div className="h-full flex items-center justify-center">
                <p className="text-muted-foreground">Monthly attendance summary would appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}