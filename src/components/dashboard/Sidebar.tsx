import { Link } from "react-router-dom";
import {
  ChevronLeft,
  Home,
  Users,
  BarChart,
  Settings,
  CalendarDays,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Logo from "@/components/shared/Logo";
import { useAuth } from "@/contexts/AuthContext";

interface SidebarProps {
  collapsed: boolean;
  toggleSidebar: () => void;
}

export const Sidebar = ({ collapsed, toggleSidebar }: SidebarProps) => {
  const { user } = useAuth();
  
  // Get user name from authentication context
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário';
  
  return (
    <aside 
      className={cn(
        "h-screen fixed top-0 left-0 z-20 border-r border-border/40 bg-slate-900/95 transition-all duration-300",
        collapsed ? "w-[60px]" : "w-[240px]"
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-border/40 px-3">
        {!collapsed && (
          <Logo />
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8", collapsed && "mx-auto")}
          onClick={toggleSidebar}
        >
          <ChevronLeft 
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform", 
              collapsed && "rotate-180"
            )} 
          /> 
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
      </div>
      
      <nav className="flex flex-col gap-1 p-2">
        <SidebarItem 
          icon={<Home className="h-4 w-4" />} 
          label="Dashboard" 
          to="/dashboard" 
          collapsed={collapsed}
          active
        />
        <SidebarItem 
          icon={<Users className="h-4 w-4" />} 
          label="Agentes" 
          to="/agents" 
          collapsed={collapsed}
        />
        <SidebarItem 
          icon={<CalendarDays className="h-4 w-4" />} 
          label="Campanhas" 
          to="/campaigns" 
          collapsed={collapsed}
        />
        <SidebarItem 
          icon={<BarChart className="h-4 w-4" />} 
          label="Analytics" 
          to="/analytics" 
          collapsed={collapsed}
        />
        <SidebarItem 
          icon={<Settings className="h-4 w-4" />} 
          label="Configurações" 
          to="/settings" 
          collapsed={collapsed}
        />
      </nav>
      
      <div className="absolute bottom-0 left-0 right-0 border-t border-border/40 p-2">
        <div className={cn(
          "flex items-center rounded-md bg-slate-800/60 p-2",
          collapsed ? "justify-center" : "justify-between"
        )}>
          <div className={cn(
            "flex items-center gap-2",
            collapsed && "justify-center"
          )}>
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-primary/10">
              <User className="h-4 w-4 text-primary" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-xs font-medium text-slate-100">{userName}</span>
                <span className="text-xs text-slate-300">Pro Plan</span>
              </div>
            )}
          </div>
          {!collapsed && (
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Settings className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
};

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  to: string;
  collapsed: boolean;
  active?: boolean;
}

const SidebarItem = ({ icon, label, to, collapsed, active }: SidebarItemProps) => {
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-2 text-sm text-slate-200/80 transition-colors hover:bg-slate-800 hover:text-slate-200",
        collapsed ? "justify-center" : "",
        active && "bg-primary/20 font-medium text-primary hover:bg-primary/30 hover:text-primary"
      )}
    >
      <div className={cn("flex h-5 w-5 items-center justify-center", active && "text-primary")}>
        {icon}
      </div>
      {!collapsed && <span>{label}</span>}
    </Link>
  );
};
