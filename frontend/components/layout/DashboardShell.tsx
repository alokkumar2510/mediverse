"use client";

import { useUIStore } from "@/stores/uiStore";
import { SidebarNav } from "@/components/layout/Sidebar";
import { TopNavbar } from "@/components/layout/Navbar";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
  children: React.ReactNode;
  className?: string;
}

export function DashboardShell({ children, className }: DashboardShellProps) {
  const { sidebarOpen } = useUIStore();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopNavbar />
      <SidebarNav />

      <main
        id="dashboard-main"
        className={cn(
          "flex-1 pt-[var(--navbar-height)] transition-[padding] duration-300 ease-spring",
          sidebarOpen ? "md:pl-[var(--sidebar-width)]" : "pl-0",
          className
        )}
      >
        <div className="px-5 md:px-8 py-7 max-w-[1280px] mx-auto animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}