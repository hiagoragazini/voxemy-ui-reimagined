
import { useState } from "react";
import { Search, Bell, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface HeaderProps {
  openSidebar: () => void;
  userName?: string;
  userAvatar?: string;
  sidebarCollapsed?: boolean;
}

export const Header = ({ 
  openSidebar, 
  userName = "Usuário", 
  userAvatar,
  sidebarCollapsed = false
}: HeaderProps) => {
  const [showSearch, setShowSearch] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border/40 bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-3">
        {sidebarCollapsed && (
          <Button variant="ghost" size="icon" onClick={openSidebar} className="h-8 w-8">
            <Menu className="h-4 w-4" />
            <span className="sr-only">Menu</span>
          </Button>
        )}
        
        <div className={cn("hidden transition-all duration-200 md:block", showSearch && "hidden md:hidden")}>
          <h1 className="text-xl font-semibold">Dashboard</h1>
        </div>

        <div className={cn("hidden max-w-md flex-1 md:flex", showSearch && "flex")}>
          <div className="relative w-full max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar..."
              className="w-full bg-background pl-8 focus-visible:ring-1 md:w-80"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setShowSearch(!showSearch)}
        >
          <Search className="h-5 w-5" />
          <span className="sr-only">Search</span>
        </Button>
        
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary"></span>
        </Button>
        
        <div className="hidden items-center gap-2 rounded-full border border-border/40 bg-background p-1 pl-3 pr-1 md:flex">
          <span className="text-sm font-medium leading-none">{userName}</span>
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-primary/10">
            {userAvatar ? (
              <img src={userAvatar} alt={userName} className="h-full w-full object-cover" />
            ) : (
              <User className="h-5 w-5 text-primary" />
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
