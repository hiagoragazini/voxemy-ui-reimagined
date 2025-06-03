
import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface TooltipCustomProps {
  content: string;
  children: React.ReactNode;
  className?: string;
}

export function TooltipCustom({ content, children, className }: TooltipCustomProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className={cn(
          "absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-md shadow-lg",
          "bottom-full left-1/2 transform -translate-x-1/2 mb-2",
          "before:content-[''] before:absolute before:top-full before:left-1/2 before:transform before:-translate-x-1/2",
          "before:border-4 before:border-transparent before:border-t-gray-900",
          "max-w-xs text-center whitespace-normal",
          className
        )}>
          {content}
        </div>
      )}
    </div>
  );
}
