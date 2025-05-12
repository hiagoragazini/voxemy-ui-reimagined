
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { 
  LayoutDashboard, 
  Users, 
  Phone,
  PieChart,
  MenuIcon, 
  Settings,
  MessageSquare,
  PhoneCall,
  BarChart2,
  Activity
} from "lucide-react";

const mainMenuItems = [
  {
    title: "Dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
    href: "/dashboard",
  },
  {
    title: "Agentes",
    icon: <Users className="h-5 w-5" />,
    href: "/agents",
  },
  {
    title: "Campanhas",
    icon: <MessageSquare className="h-5 w-5" />,
    href: "/campaigns",
  },
  {
    title: "Leads",
    icon: <Phone className="h-5 w-5" />,
    href: "/leads",
  },
  {
    title: "Chamadas",
    icon: <PhoneCall className="h-5 w-5" />,
    href: "/calls",
  },
  {
    title: "Relatórios",
    icon: <BarChart2 className="h-5 w-5" />,
    href: "/reports",
  },
];

const otherMenuItems = [
  {
    title: "Configurações",
    icon: <Settings className="h-5 w-5" />,
    href: "/settings",
  },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open = false, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile Sidebar */}
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent side="left" className="p-0">
          <div className="p-6 border-b">
            <div className="flex items-center">
              <div className="text-2xl font-bold">Voxemy</div>
            </div>
          </div>

          <div className="p-4">
            <nav className="grid gap-2">
              {mainMenuItems.map((item, index) => (
                <NavLink
                  key={index}
                  to={item.href}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-lg px-3 py-2 text-gray-700 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50 ${
                      isActive
                        ? "bg-blue-100 text-blue-900 dark:bg-blue-800/30 dark:text-blue-400"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`
                  }
                >
                  {item.icon}
                  <span>{item.title}</span>
                </NavLink>
              ))}

              <div className="my-2 border-t" />

              {otherMenuItems.map((item, index) => (
                <NavLink
                  key={index}
                  to={item.href}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-lg px-3 py-2 text-gray-700 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50 ${
                      isActive
                        ? "bg-blue-100 text-blue-900 dark:bg-blue-800/30 dark:text-blue-400"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`
                  }
                >
                  {item.icon}
                  <span>{item.title}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-20 hidden h-full w-64 border-r bg-white dark:bg-gray-900 dark:border-gray-800 lg:block">
        <div className="p-6 border-b">
          <div className="flex items-center">
            <div className="text-2xl font-bold">Voxemy</div>
          </div>
        </div>

        <div className="p-4">
          <nav className="grid gap-2">
            {mainMenuItems.map((item, index) => (
              <NavLink
                key={index}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50 ${
                    isActive
                      ? "bg-blue-100 text-blue-900 dark:bg-blue-800/30 dark:text-blue-400"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`
                }
              >
                {item.icon}
                <span>{item.title}</span>
              </NavLink>
            ))}

            <div className="my-2 border-t dark:border-gray-800" />

            {otherMenuItems.map((item, index) => (
              <NavLink
                key={index}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50 ${
                    isActive
                      ? "bg-blue-100 text-blue-900 dark:bg-blue-800/30 dark:text-blue-400"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`
                }
              >
                {item.icon}
                <span>{item.title}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-4 left-0 right-0 px-4">
          <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-400">
                  Sistema em Tempo Real
                </p>
                <p className="text-xs text-blue-800 dark:text-blue-300 mt-1">
                  Monitoramento ativo
                </p>
              </div>
              <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-pulse" />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export function MobileSidebarTrigger({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className="lg:hidden"
      aria-label="Menu"
    >
      <MenuIcon className="h-5 w-5" />
    </Button>
  );
}
