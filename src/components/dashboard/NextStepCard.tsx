
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
    <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 group">
      <div className="flex items-start gap-2">
        <div className="relative flex-shrink-0">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-lg">
            {icon}
          </div>
          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-blue-600 rounded-full flex items-center justify-center text-xs text-white font-medium">
            {number}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors text-sm leading-snug">
            {title}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{description}</p>
        </div>
        <div className="text-muted-foreground transition-transform group-hover:translate-x-1 flex-shrink-0">
          <ChevronRight className="h-3.5 w-3.5" />
        </div>
      </div>
    </div>
  );
}
