import { DashboardHeader } from "@/components/dashboard/header";
import { TeacherSidebar } from "@/components/dashboard/teacher-sidebar";
import { TeacherOverview } from "@/components/dashboard/teacher/overview";
import { DashboardShell } from "@/components/dashboard/shell";
import { getCurrentDateTime } from "@/lib/date-utils";

export default function TeacherDashboardPage() {
  const { currentDate, currentTime } = getCurrentDateTime();
  
  return (
    <div className="flex min-h-screen bg-background">
      <TeacherSidebar />
      <div className="flex-1">
        <DashboardHeader userRole="Teacher" date={currentDate} time={currentTime} />
        <DashboardShell>
          <TeacherOverview />
        </DashboardShell>
      </div>
    </div>
  );
}