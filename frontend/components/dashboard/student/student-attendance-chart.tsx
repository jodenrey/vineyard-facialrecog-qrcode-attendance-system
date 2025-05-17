"use client"

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  timeIn: string | null;
  userId: string;
}

interface StudentAttendanceChartProps {
  attendanceRecords: AttendanceRecord[];
}

export function StudentAttendanceChart({ attendanceRecords = [] }: StudentAttendanceChartProps) {
  const [chartData, setChartData] = useState<any[]>([]);
  
  useEffect(() => {
    // Generate chart data based on attendance records
    const processAttendanceData = () => {
      if (attendanceRecords.length === 0) {
        return generateEmptyChartData();
      }
      
      // Get the last 10 months
      const today = new Date();
      const tenMonthsAgo = subMonths(today, 9);
      
      const monthRange = eachMonthOfInterval({
        start: tenMonthsAgo,
        end: today
      });
      
      // Create chart data for each month
      const data = monthRange.map(month => {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);
        const monthName = format(month, 'MMM');
        
        // Filter records for this month
        const monthRecords = attendanceRecords.filter(record => {
          const recordDate = parseISO(record.date);
          return recordDate >= monthStart && recordDate <= monthEnd;
        });
        
        // Count attendance statuses
        const present = monthRecords.filter(record => record.status === 'PRESENT').length;
        const absent = monthRecords.filter(record => record.status === 'ABSENT').length;
        const late = monthRecords.filter(record => record.status === 'LATE').length;
        
        return {
          name: monthName,
          present,
          absent,
          late,
        };
      });
      
      return data;
    };
    
    // Generate empty chart data for demonstration when no records exist
    const generateEmptyChartData = () => {
      const today = new Date();
      const tenMonthsAgo = subMonths(today, 9);
      
      const monthRange = eachMonthOfInterval({
        start: tenMonthsAgo,
        end: today
      });
      
      return monthRange.map(month => ({
        name: format(month, 'MMM'),
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
          left: 0,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="present" stackId="a" fill="hsl(var(--chart-1))" name="Present" minPointSize={0} />
        <Bar dataKey="absent" stackId="a" fill="hsl(var(--chart-3))" name="Absent" minPointSize={0} />
        <Bar dataKey="late" stackId="a" fill="hsl(var(--chart-4))" name="Late" minPointSize={0} />
      </BarChart>
    </ResponsiveContainer>
  );
}