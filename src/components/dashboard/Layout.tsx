
import React from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen bg-apple-bg">
      {/* Sidebar fixa na esquerda - versão desktop */}
      <div className="w-72 fixed left-0 h-full z-10 hidden md:block shadow-[1px_0_3px_rgba(0,0,0,0.05)]">
        <Sidebar />
      </div>
      
      {/* Versão móvel da sidebar */}
      <div className="fixed left-0 h-full z-10 md:hidden">
        <Sidebar />
      </div>
      
      {/* Conteúdo principal com header e main */}
      <div className="flex flex-col w-full md:pl-72">
        <Header />
        <main className="flex-1 bg-[#f5f5f7] dark:bg-gray-900">
          {children}
        </main>
      </div>
    </div>
  );
}
