
import React from "react";
import { ChevronRight } from "lucide-react";

interface NextStepCardProps {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

export function NextStepCard({ number, title, description, icon }: NextStepCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-apple hover:shadow-apple-hover transition-all duration-200 group hover:-translate-y-1 flex flex-col justify-start">
      <div className="flex items-start gap-3 flex-1">
        <div className="relative flex-shrink-0">
          <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded-lg mb-1">
            {icon}
          </div>
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-xs text-white font-semibold shadow-sm">
            {number}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors mb-1 leading-tight">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-2">{description}</p>
          <div className="flex items-center text-blue-600 text-sm font-medium group-hover:text-blue-700 transition-colors">
            <span>Começar agora</span>
            <ChevronRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </div>
  );
}
