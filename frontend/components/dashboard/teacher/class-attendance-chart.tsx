"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { day: '1', attendance: 92 },
  { day: '2', attendance: 96 },
  { day: '3', attendance: 89 },
  { day: '4', attendance: 93 },
  { day: '5', attendance: 85 },
  { day: '8', attendance: 93 },
  { day: '9', attendance: 97 },
  { day: '10', attendance: 94 },
  { day: '11', attendance: 90 },
  { day: '12', attendance: 92 },
  { day: '15', attendance: 96 },
  { day: '16', attendance: 93 },
  { day: '17', attendance: 91 },
  { day: '18', attendance: 94 },
  { day: '19', attendance: 95 },
  { day: '22', attendance: 93 },
  { day: '23', attendance: 92 },
  { day: '24', attendance: 95 },
  { day: '25', attendance: 91 },
  { day: '26', attendance: 94 },
];

export function ClassAttendanceChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="day" 
          label={{ value: 'Day of Month', position: 'insideBottomRight', offset: -10 }}
        />
        <YAxis 
          domain={[75, 100]} 
          label={{ value: 'Attendance %', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="attendance" 
          stroke="hsl(var(--chart-1))" 
          activeDot={{ r: 8 }}
          name="Attendance %"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}