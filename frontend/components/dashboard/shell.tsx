interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="mx-auto space-y-6">
        {children}
      </div>
    </main>
  );
}