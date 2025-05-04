
"use client";

import { useState } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { Header } from "@/components/ui/header";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div className="h-screen flex bg-gray-50/60 dark:bg-slate-950">
      <Sidebar collapsed={collapsed} toggleSidebar={toggleSidebar} />
      <main className={`flex-1 transition-all duration-300 overflow-auto ${collapsed ? 'ml-[60px]' : 'ml-[240px]'}`}>
        <Header openSidebar={toggleSidebar} sidebarCollapsed={collapsed} userName="João" />
        {children}
      </main>
    </div>
  );
};
