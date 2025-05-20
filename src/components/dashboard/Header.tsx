
import { useState } from "react";
import { Bell, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-md border-b border-apple-border h-16 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <div className="relative w-64 max-w-xs hidden md:block">
          <Search className="absolute left-3 top-3 h-4 w-4 text-apple-text-secondary" />
          <input
            type="search"
            placeholder="Buscar..."
            className="w-full min-w-[280px] bg-secondary/50 py-2.5 pl-10 pr-4 text-sm rounded-lg h-10 focus:outline-none focus:ring-2 focus:ring-primary-apple/30 focus:bg-white transition-all duration-200"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative rounded-full h-10 w-10 flex items-center justify-center hover:bg-secondary">
          <Bell className="h-5 w-5 text-apple-text-secondary" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary-apple rounded-full"></span>
        </Button>

        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 rounded-full hover:bg-secondary h-10"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center">
              <User className="h-5 w-5 text-apple-text-secondary" />
            </div>
            <span className="text-sm font-medium hidden md:block">
              {user?.email?.split("@")[0] || "Usuário"}
            </span>
          </Button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl shadow-apple bg-white border border-apple-border z-10 animate-fade-in overflow-hidden">
              <div className="py-1">
                <a
                  href="/settings"
                  className="block px-4 py-2.5 text-sm text-apple-text-primary hover:bg-secondary transition-colors duration-200"
                >
                  Configurações
                </a>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2.5 text-sm text-apple-text-primary hover:bg-secondary transition-colors duration-200"
                >
                  Sair
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
