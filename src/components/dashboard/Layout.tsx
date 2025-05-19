
import React from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen">
      {/* Sidebar fixa na esquerda */}
      <div className="fixed left-0 h-full z-10 md:relative">
        <Sidebar />
      </div>
      
      {/* Conteúdo principal com header e main */}
      <div className="flex flex-col flex-1 w-full">
        <Header />
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 md:pl-64 pl-0">
          {children}
        </main>
      </div>
    </div>
  );
}
