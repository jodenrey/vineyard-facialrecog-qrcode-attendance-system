import { DashboardHeader } from "@/components/dashboard/header";
import { AdminSidebar } from "@/components/dashboard/admin-sidebar";
import { UsersManagement } from "@/components/dashboard/admin/users-management";
import { DashboardShell } from "@/components/dashboard/shell";
import { getCurrentDateTime } from "@/lib/date-utils";

export default function AdminUsersPage() {
  const { currentDate, currentTime } = getCurrentDateTime();
  
  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <div className="flex-1">
        <DashboardHeader userRole="Admin" date={currentDate} time={currentTime} />
        <DashboardShell>
          <UsersManagement />
        </DashboardShell>
      </div>
    </div>
  );
}