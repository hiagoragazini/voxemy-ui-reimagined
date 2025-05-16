
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
    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 group">
      <div className="flex items-start gap-4">
        <div className="relative">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-2.5 rounded-lg">
            {icon}
          </div>
          <div className="absolute -top-2 -right-2 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-xs text-white font-medium">
            {number}
          </div>
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
        <div className="text-muted-foreground transition-transform group-hover:translate-x-1">
          <ChevronRight className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
