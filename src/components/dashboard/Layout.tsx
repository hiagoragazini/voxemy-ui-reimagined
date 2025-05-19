
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
      <div className="w-64 fixed left-0 h-full z-10 hidden md:block">
        <Sidebar />
      </div>
      
      {/* Versão móvel da sidebar */}
      <div className="fixed left-0 h-full z-10 md:hidden">
        <Sidebar />
      </div>
      
      {/* Conteúdo principal com header e main */}
      <div className="flex flex-col w-full md:pl-64">
        <Header />
        <main className="flex-1 bg-gray-50 dark:bg-gray-900">
          <div className="px-2 py-4 sm:px-4 md:px-6 lg:px-6 xl:px-8 w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
