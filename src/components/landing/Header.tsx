
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import Logo from "../shared/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { UserCircle, LogOut } from "lucide-react";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Detecta scroll para mudar o estilo do header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const navigateToDashboard = () => {
    navigate("/dashboard");
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? "bg-slate-900/95 backdrop-blur-md py-3 shadow-lg" 
          : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Logo />
        
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Button 
                variant="ghost" 
                className="text-white hover:bg-slate-800"
                onClick={navigateToDashboard}
              >
                <UserCircle className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
              <Button 
                variant="outline" 
                className="border-red-500 bg-red-500/20 text-white hover:bg-red-600 hover:text-white"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button 
                variant="outline" 
                className="border-violet-500 bg-violet-500/20 text-white hover:bg-violet-600 hover:text-white"
              >
                Entrar
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
