
import React from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen">
      <Sidebar className="w-64 shrink-0" />
      <div className="flex flex-col flex-1">
        <Header />
        <main className="flex-1 overflow-auto bg-background dark:bg-gray-900">
          {children}
        </main>
      </div>
    </div>
  );
}
