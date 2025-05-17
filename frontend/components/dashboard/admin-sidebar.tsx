"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  BookOpen,
  School
} from "lucide-react";

export function AdminSidebar() {
  const pathname = usePathname();
  
  const routes = [
    {
      href: "/dashboard/admin",
      icon: LayoutDashboard,
      title: "Overview",
    },
    {
      href: "/dashboard/admin/users",
      icon: Users,
      title: "Users",
    },
    {
      href: "/dashboard/admin/classes",
      icon: BookOpen,
      title: "Classes",
    },
    {
      href: "/dashboard/admin/attendance",
      icon: ClipboardList,
      title: "Attendance",
    },
  ];
  
  return (
    <div className="hidden border-r bg-card md:block md:w-64">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard/admin" className="flex items-center gap-2 font-semibold">
          <School className="h-6 w-6" />
          <span>VCA Admin</span>
        </Link>
      </div>
      <div className="flex flex-col gap-2 p-4">
        {routes.map((route) => (
          <Button
            key={route.href}
            variant={pathname === route.href ? "default" : "ghost"}
            className={cn(
              "justify-start",
              pathname === route.href ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            )}
            asChild
          >
            <Link href={route.href}>
              <route.icon className="mr-2 h-5 w-5" />
              {route.title}
            </Link>
          </Button>
        ))}
      </div>
    </div>
  );
}