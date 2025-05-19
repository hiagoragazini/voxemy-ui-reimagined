
import React from 'react';
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface HeaderProps {
  onLoginClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLoginClick }) => {
  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-lg bg-slate-900/75 border-b border-slate-800">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-blue-600 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L2 22" />
                <path d="M16.8 7.2L7.2 16.8" />
                <path d="M22 15V2h-13" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white">Voxemy</span>
          </Link>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/#benefits" className="text-sm text-slate-300 hover:text-white transition-colors">
            Benefícios
          </Link>
          <Link to="/#how-it-works" className="text-sm text-slate-300 hover:text-white transition-colors">
            Como funciona
          </Link>
          <Link to="/#pricing" className="text-sm text-slate-300 hover:text-white transition-colors">
            Preços
          </Link>
          <Link to="/#testimonials" className="text-sm text-slate-300 hover:text-white transition-colors">
            Depoimentos
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <Button
            onClick={onLoginClick}
            variant="outline"
            className="hidden md:flex border-blue-400 text-blue-400 hover:text-blue-300 hover:border-blue-300"
          >
            Entrar
          </Button>
          <Button
            variant="default"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Começar agora
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
