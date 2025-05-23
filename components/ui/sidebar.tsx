
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  Phone, 
  BarChart3, 
  Settings, 
  Menu,
  ChevronLeft,
  Phone as PhoneIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface SidebarProps {
  collapsed: boolean;
  toggleSidebar: () => void;
}

export const Sidebar = ({ collapsed, toggleSidebar }: SidebarProps) => {
  const pathname = usePathname();
  
  const menuItems = [
    { 
      name: "Dashboard", 
      href: "/dashboard", 
      icon: LayoutDashboard 
    },
    { 
      name: "Agentes", 
      href: "/agentes", 
      icon: Users 
    },
    { 
      name: "Campanhas", 
      href: "/campanhas", 
      icon: Phone 
    },
    { 
      name: "Analytics", 
      href: "/analytics", 
      icon: BarChart3 
    },
    { 
      name: "Configurações", 
      href: "/configuracoes", 
      icon: Settings 
    }
  ];

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r border-border/40 bg-background transition-all duration-300 shadow-[1px_0_3px_rgba(0,0,0,0.05)]",
        collapsed ? "w-[60px]" : "w-[240px]"
      )}
    >
      <div className="flex h-full flex-col">
        <div className={cn("h-16 border-b border-border/40 flex items-center", 
          collapsed ? "justify-center" : "px-6 justify-between"
        )}>
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-md bg-blue-100 flex items-center justify-center">
                <PhoneIcon className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-lg font-semibold tracking-tight">Voxemy</span>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              collapsed ? "px-0" : "", "h-10 w-10"
            )}
          >
            {collapsed ? (
              <Menu className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
            <span className="sr-only">
              {collapsed ? "Expandir menu" : "Recolher menu"}
            </span>
          </button>
        </div>
        
        <div className="flex-1 overflow-auto pt-4">
          <nav className="space-y-1 px-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors",
                    isActive
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
                      : "text-gray-500 hover:text-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 dark:hover:text-blue-400",
                    collapsed && "justify-center px-0"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {!collapsed && <span className="text-base">{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="border-t border-border/40 p-4">
          <div
            className={cn(
              "rounded-md bg-blue-50 py-3 dark:bg-blue-900/20",
              collapsed ? "px-2" : "px-4"
            )}
          >
            {!collapsed ? (
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-2">
                  Utilização de Créditos
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">150 min</span>
                  <span className="text-xs font-medium">300 min</span>
                </div>
                <Progress className="h-1.5 my-1" value={50} fill="bg-blue-600" />
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <Progress className="h-1.5 w-full" value={50} fill="bg-blue-600" />
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
