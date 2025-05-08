
import { useState } from "react";
import { Search, Bell, Menu, LogOut, Settings as SettingsIcon, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/sonner";

interface HeaderProps {
  openSidebar?: () => void;
  userAvatar?: string;
  sidebarCollapsed?: boolean;
}

export const Header = ({ 
  openSidebar, 
  userAvatar,
  sidebarCollapsed = false
}: HeaderProps) => {
  const [showSearch, setShowSearch] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  
  // Get the user's name from authentication context
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário';

  const handleProfileClick = (path: string) => {
    navigate(path);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/'); // Redirect to home page after logout
      toast.success('Você saiu com sucesso!');
    } catch (error) {
      toast.error('Erro ao sair. Tente novamente.');
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border/40 bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-4">
        {sidebarCollapsed && openSidebar && (
          <Button variant="ghost" size="icon" onClick={openSidebar} className="h-8 w-8">
            <Menu className="h-4 w-4" />
            <span className="sr-only">Menu</span>
          </Button>
        )}
        
        <div className={cn("md:hidden", showSearch ? "block" : "hidden")}>
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar..."
              className="w-full bg-muted pl-8 focus-visible:ring-1 rounded-lg h-9"
            />
          </div>
        </div>
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
          <span className="sr-only">Buscar</span>
        </Button>
        
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notificações</span>
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary"></span>
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2 hover:bg-accent rounded-full">
              <span className="text-sm font-medium leading-none hidden md:block text-violet-600">{userName}</span>
              <Avatar className="h-8 w-8 border border-violet-200">
                {userAvatar ? (
                  <AvatarImage src={userAvatar} alt={userName} />
                ) : (
                  <AvatarFallback className="bg-violet-100 text-violet-600">
                    {userName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleProfileClick('/settings')} className="cursor-pointer">
              <UserCog className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleProfileClick('/settings')} className="cursor-pointer">
              <SettingsIcon className="mr-2 h-4 w-4" />
              <span>Configurações</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
