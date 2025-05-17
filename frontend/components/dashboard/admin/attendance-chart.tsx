"use client"

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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

interface AttendanceChartProps {
  attendanceRecords?: AttendanceRecord[];
  date?: Date;
}

export function AttendanceChart({ attendanceRecords = [], date = new Date() }: AttendanceChartProps) {
  const [chartData, setChartData] = useState<any[]>([]);
  
  useEffect(() => {
    // Generate chart data based on attendance records
    const processAttendanceData = () => {
      if (attendanceRecords.length === 0) {
        return generateEmptyChartData();
      }
      
      // Group by grade
      const gradeMap = new Map<number, { present: number; absent: number; late: number }>();
      
      // Initialize grades 1-6
      for (let i = 1; i <= 6; i++) {
        gradeMap.set(i, { present: 0, absent: 0, late: 0 });
      }
      
      // Process attendance records
      attendanceRecords.forEach(record => {
        if (record.user && record.user.class) {
          const grade = record.user.class.grade;
          const gradeStats = gradeMap.get(grade) || { present: 0, absent: 0, late: 0 };
          
          if (record.status === 'PRESENT') {
            gradeStats.present += 1;
          } else if (record.status === 'ABSENT') {
            gradeStats.absent += 1;
          } else if (record.status === 'LATE') {
            gradeStats.late += 1;
          }
          
          gradeMap.set(grade, gradeStats);
        }
      });
      
      // Convert map to array for chart
      const data = Array.from(gradeMap.entries()).map(([grade, stats]) => ({
        name: `Grade ${grade}`,
        present: stats.present,
        absent: stats.absent,
        late: stats.late,
      }));
      
      return data;
    };
    
    // Generate empty chart data for demonstration when no records exist
    const generateEmptyChartData = () => {
      return Array.from({ length: 6 }, (_, i) => ({
        name: `Grade ${i + 1}`,
        present: 0,
        absent: 0,
        late: 0,
      }));
    };
    
    setChartData(processAttendanceData());
  }, [attendanceRecords]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        width={500}
        height={300}
        data={chartData}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
        barSize={20}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="present" fill="hsl(var(--chart-1))" name="Present" minPointSize={0} />
        <Bar dataKey="absent" fill="hsl(var(--chart-3))" name="Absent" minPointSize={0} />
        <Bar dataKey="late" fill="hsl(var(--chart-4))" name="Late" minPointSize={0} />
      </BarChart>
    </ResponsiveContainer>
  );
}