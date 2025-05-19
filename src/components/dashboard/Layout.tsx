
import React from "react";
import Sidebar from "./Sidebar";
import { Header } from "./Header";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar fixed on the left */}
      <div className="fixed left-0 h-full z-10">
        <Sidebar />
      </div>
      
      {/* Content with padding for sidebar */}
      <div className="flex flex-col flex-1 ml-64">
        <Header />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export { Layout };
export default Layout;
