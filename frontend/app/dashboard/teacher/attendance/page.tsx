import { DashboardHeader } from "@/components/dashboard/header";
import { TeacherSidebar } from "@/components/dashboard/teacher-sidebar";
import { ClassAttendance } from "@/components/dashboard/teacher/class-attendance";
import { DashboardShell } from "@/components/dashboard/shell";
import { getCurrentDateTime } from "@/lib/date-utils";

export default function TeacherAttendancePage() {
  const { currentDate, currentTime } = getCurrentDateTime();
  
  return (
    <div className="flex min-h-screen bg-background">
      <TeacherSidebar />
      <div className="flex-1">
        <DashboardHeader userRole="Teacher" date={currentDate} time={currentTime} />
        <DashboardShell>
          <ClassAttendance />
        </DashboardShell>
      </div>
    </div>
  );
}