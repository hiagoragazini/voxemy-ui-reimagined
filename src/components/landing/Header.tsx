
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Logo from "../shared/Logo";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  // Detecta scroll para mudar o estilo do header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
        
        <Link to="/login">
          <Button 
            variant="outline" 
            className="border-violet-500 bg-violet-500/20 text-white hover:bg-violet-600 hover:text-white"
          >
            Entrar
          </Button>
        </Link>
      </div>
    </header>
  );
};

export default Header;
