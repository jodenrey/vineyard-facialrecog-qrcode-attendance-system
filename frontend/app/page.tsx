import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-6 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Vineyard Christian Academy</h1>
          <p className="text-muted-foreground mt-2">Attendance System Login</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}