
import React from "react";
import { Card } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string;
  change?: {
    value: string;
    type: "increase" | "decrease" | "neutral";
  };
  icon: React.ReactNode;
}

export function StatsCard({ title, value, change, icon }: StatsCardProps) {
  return (
    <Card className="p-4 border-border/40 hover:border-blue-200 transition-colors duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {change && (
            <p
              className={`text-xs flex items-center mt-1 ${
                change.type === "increase"
                  ? "text-green-600"
                  : change.type === "decrease"
                  ? "text-red-600"
                  : "text-amber-600"
              }`}
            >
              <span className="inline-block mr-1">
                {change.type === "increase"
                  ? "↑"
                  : change.type === "decrease"
                  ? "↓"
                  : "↔"}
              </span>{" "}
              {change.value}
            </p>
          )}
        </div>
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
          {icon}
        </div>
      </div>
    </Card>
  );
}
