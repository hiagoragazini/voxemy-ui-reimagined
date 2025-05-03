
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
      <div className="flex items-center gap-4">
        {sidebarCollapsed && (
          <Button variant="ghost" size="icon" onClick={openSidebar} className="h-8 w-8">
            <Menu className="h-4 w-4" />
            <span className="sr-only">Menu</span>
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className={cn("hidden md:block max-w-xs")}>
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar..."
              className="w-full bg-muted pl-8 focus-visible:ring-1 rounded-lg h-9"
            />
          </div>
        </div>

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
          <span className="sr-only">Notificações</span>
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary"></span>
        </Button>
        
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium leading-none hidden md:block">{userName}</span>
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-violet-100 text-violet-600">
            {userAvatar ? (
              <img src={userAvatar} alt={userName} className="h-full w-full object-cover" />
            ) : (
              <User className="h-4 w-4" />
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
