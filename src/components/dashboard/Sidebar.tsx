
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { Separator } from "@/components/ui/separator";
import Logo from "../shared/Logo";
import { Briefcase, Home, User, Phone, BarChart2, Settings } from "lucide-react";

// Define the navigation items for the sidebar
const navItems = [
  { name: "Dashboard", path: "/dashboard", icon: Home },
  { name: "Agentes", path: "/agents", icon: User },
  { name: "Campanhas", path: "/campaigns", icon: Phone },
  { name: "Meu Negócio", path: "/business", icon: Briefcase },
  { name: "Analytics", path: "/analytics", icon: BarChart2 },
  { name: "Configurações", path: "/settings", icon: Settings },
];

export function Sidebar({ className }: { className?: string }) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  return (
    <div
      className={cn(
        "flex flex-col border-r bg-white dark:bg-gray-800 dark:border-gray-700 h-full",
        className
      )}
    >
      <div className="px-4 py-3">
        <Logo size="md" className="mb-2" />
        <Separator className="my-3" />
      </div>
      <div className="py-2">
        <nav className="grid gap-1 px-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                  isActive
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300"
                    : "text-gray-600 hover:bg-blue-50 dark:text-gray-400 dark:hover:bg-blue-900/20 dark:hover:text-blue-300"
                )
              }
            >
              <span className="flex h-6 w-6 items-center justify-center">
                {item.icon && <item.icon className="h-5 w-5" />}
              </span>
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
