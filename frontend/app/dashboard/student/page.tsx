import { DashboardHeader } from "@/components/dashboard/header";
import { StudentSidebar } from "@/components/dashboard/student-sidebar";
import { StudentOverview } from "@/components/dashboard/student/overview";
import { DashboardShell } from "@/components/dashboard/shell";
import { getCurrentDateTime } from "@/lib/date-utils";

export default function StudentDashboardPage() {
  const { currentDate, currentTime } = getCurrentDateTime();
  
  return (
    <div className="flex min-h-screen bg-background">
      <StudentSidebar />
      <div className="flex-1">
        <DashboardHeader userRole="Student" date={currentDate} time={currentTime} />
        <DashboardShell>
          <StudentOverview />
        </DashboardShell>
      </div>
    </div>
  );
}