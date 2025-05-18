
import React from "react";
import Sidebar from "./Sidebar";
import { Header } from "./Header";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex h-screen">
      {/* Sidebar fixo na esquerda */}
      <div className="fixed left-0 h-full z-10 lg:relative">
        <Sidebar />
      </div>
      
      {/* Conteúdo principal com padding na esquerda para acomodar a sidebar */}
      <div className="flex flex-col flex-1 lg:ml-0 ml-0">
        <Header />
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 pl-0 lg:pl-64">
          {children}
        </main>
      </div>
    </div>
  );
}

export { Layout };
export default Layout;
