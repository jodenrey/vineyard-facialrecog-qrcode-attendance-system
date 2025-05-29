# Vineyard Academy Automatic Attendance System

## Overview
The Vineyard Academy Attendance System automatically records student and teacher attendance based on login times and grade-specific schedules. The system follows Philippine time and implements different schedules for different grade levels.

## Features

### Automatic Attendance Recording
- **Triggers**: Attendance is automatically recorded when users log in via:
  - Manual login (email/password)
  - Biometric authentication (face recognition + QR code)
- **Time-based Status**: 
  - `PRESENT`: Login before or at scheduled start time
  - `LATE`: Login after scheduled start time
  - `ABSENT`: No login recorded for the day

### Grade-Specific Schedules
- **Grades 1-3 (Morning Session)**:
  - Start Time: 7:30 AM
  - End Time: 11:30 AM
- **Grades 4-6 (Afternoon Session)**:
  - Start Time: 12:35 PM
  - End Time: 5:30 PM
- **Active Days**: Monday to Friday (no attendance on weekends)

### User Roles
1. **Students**: 
   - Attendance recorded based on their assigned class grade
   - Can view their own attendance and teacher status
2. **Teachers**: 
   - Attendance recorded based on their assigned class schedule
   - Can view their own attendance and manage class attendance
3. **Admins**: 
   - Can view complete attendance reports for both students and teachers

## System Workflow

### Login Process
1. User logs in using any authentication method
2. System validates credentials
3. If successful and user is STUDENT or TEACHER:
   - Check if it's a school day (Monday-Friday)
   - Determine user's schedule based on role and class
   - Calculate attendance status based on current Philippine time
   - Record attendance (only once per day)
4. Display attendance status message to user

### Attendance Status Logic
```typescript
// Convert login time and start time to minutes
const loginMinutes = loginHour * 60 + loginMinute;
const startMinutes = startHour * 60 + startMinute;

// Determine status
if (loginMinutes <= startMinutes) {
  status = 'PRESENT';
} else {
  status = 'LATE';
}
```

### Absent Marking
- A scheduled job (API endpoint: `/api/attendance/mark-absent`) should run at the end of each school day
- Marks all students and teachers who haven't logged in as `ABSENT`
- Only runs on school days

## Dashboard Features

### Student Dashboard
- **Today's Status**: Shows if student is present, late, or absent
- **Teacher Status**: Shows if their assigned teacher is present, late, or absent
- **Monthly Attendance**: Shows attendance percentage and statistics
- **Attendance History**: List of past attendance records

### Teacher Dashboard
- **My Attendance**: Shows teacher's own attendance status
- **Class Management**: View and manage student attendance
- **Student Statistics**: Overview of class attendance rates

### Admin Dashboard
- **Comprehensive Reports**: Separate tabs for student and teacher attendance
- **Filtering Options**: Filter by date, grade, section, status
- **Export Features**: Excel and PDF export (implementation ready)

## Database Schema

### Key Models
```prisma
model Attendance {
  id        String   @id @default(uuid())
  date      DateTime @default(now())
  status    Status   @default(PRESENT)
  timeIn    String?
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  classDate String?  // Format: "YYYY-MM-DD"
  
  @@unique([userId, classDate]) // One record per user per day
}

enum Status {
  PRESENT
  ABSENT
  LATE
}
```

## API Endpoints

### Authentication with Attendance
- `POST /api/auth/login` - Manual login with automatic attendance
- `POST /api/auth/verify-biometric` - Biometric login with automatic attendance

### Attendance Management
- `GET /api/attendance` - Fetch attendance records (with filters)
- `POST /api/attendance` - Manual attendance creation/update
- `POST /api/attendance/mark-absent` - Automated absent marking job

## Configuration

### Philippine Time Zone
All attendance calculations use `Asia/Manila` timezone to ensure consistency regardless of server location.

### Schedule Configuration
Located in `frontend/lib/attendance-service.ts`:
```typescript
export const ATTENDANCE_CONFIG = {
  timezone: 'Asia/Manila',
  schedules: {
    'MORNING': {
      startTime: '07:30',
      endTime: '11:30',
      grades: [1, 2, 3]
    },
    'AFTERNOON': {
      startTime: '12:35',
      endTime: '17:30',
      grades: [4, 5, 6]
    }
  }
};
```

## Implementation Notes

### Security
- Attendance is only recorded for authenticated users
- Each user can only have one attendance record per day
- Login failures do not trigger attendance recording

### Error Handling
- Attendance recording failures do not prevent login
- System continues to function even if attendance service is unavailable
- Comprehensive error logging for debugging

### Performance
- Singleton pattern for AttendanceService reduces memory usage
- Efficient database queries with proper indexing
- Minimal impact on login performance

## Future Enhancements
1. **Automated Scheduling**: Cron job for end-of-day absent marking
2. **Notifications**: Email/SMS alerts for parents when students are absent
3. **Reporting**: Advanced analytics and attendance trends
4. **Mobile App**: Dedicated mobile application for easier access
5. **Geolocation**: Location-based attendance validation
6. **Schedule Flexibility**: Support for custom schedules per class 