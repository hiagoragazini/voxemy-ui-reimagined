
import React from "react";
import { ChevronRight } from "lucide-react";

interface NextStepCardProps {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  status?: "available" | "coming-soon";
  recommended?: boolean;
}

export function NextStepCard({ 
  number, 
  title, 
  description, 
  icon, 
  status = "available",
  recommended = false 
}: NextStepCardProps) {
  const isComingSoon = status === "coming-soon";
  
  return (
    <div className={`
      bg-white dark:bg-gray-800 p-2 rounded-lg border transition-all duration-200 group hover:-translate-y-1 flex flex-col justify-start
      ${isComingSoon 
        ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 opacity-75' 
        : 'border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-blue-300'
      }
    `}>
      <div className="flex items-start gap-2 flex-1">
        <div className="relative flex-shrink-0">
          <div className={`
            p-1.5 rounded-lg mb-1
            ${isComingSoon 
              ? 'bg-gray-100 dark:bg-gray-600' 
              : 'bg-blue-50 dark:bg-blue-900/30'
            }
          `}>
            {icon}
          </div>
          <div className={`
            absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-xs text-white font-semibold shadow-sm
            ${isComingSoon ? 'bg-gray-500' : 'bg-blue-600'}
          `}>
            {number}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-0.5">
            <h3 className={`
              text-sm font-semibold leading-tight
              ${isComingSoon 
                ? 'text-gray-600 dark:text-gray-400' 
                : 'text-gray-900 dark:text-gray-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors'
              }
            `}>
              {title}
            </h3>
            {recommended && (
              <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full font-medium">
                Recomendado
              </span>
            )}
            {isComingSoon && (
              <span className="bg-gray-500 text-white text-xs px-1.5 py-0.5 rounded-full font-medium">
                Em Breve
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed mb-1.5">
            {description}
          </p>
          <div className={`
            flex items-center text-xs font-medium transition-colors
            ${isComingSoon 
              ? 'text-gray-500' 
              : 'text-blue-600 group-hover:text-blue-700'
            }
          `}>
            <span>
              {isComingSoon ? 'Em desenvolvimento' : 'Começar agora'}
            </span>
            {!isComingSoon && (
              <ChevronRight className="h-3 w-3 ml-1 transition-transform group-hover:translate-x-1" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
