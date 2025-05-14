
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import Logo from "../shared/Logo";
import { useAuth } from "@/contexts/AuthContext";

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

  const scrollToPricing = () => {
    const pricingSection = document.getElementById("pricing-plans");
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: "smooth" });
    }
  };
  
  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
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
            <div className="flex gap-2">
              <Link to="/dashboard">
                <Button 
                  variant="outline" 
                  className="border-blue-700 bg-blue-700/20 text-white hover:bg-blue-800 hover:text-white"
                >
                  Acessar Dashboard
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                className="text-white hover:bg-blue-700/20"
                onClick={handleLogout}
              >
                Sair
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link to="/auth">
                <Button 
                  variant="ghost" 
                  className="text-white hover:bg-blue-700/20"
                >
                  Entrar
                </Button>
              </Link>
              <Button 
                variant="outline" 
                className="border-blue-700 bg-blue-700/20 text-white hover:bg-blue-800 hover:text-white"
                onClick={scrollToPricing}
              >
                Começar Agora
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
