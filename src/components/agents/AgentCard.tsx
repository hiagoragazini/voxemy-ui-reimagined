
import { useState } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export interface AgentCardProps {
  id: string;
  name: string;
  description: string;
  status: "active" | "inactive" | "pending";
  usagePercentage: number;
  lastUpdated: string;
  image?: string;
  avatarLetter?: string;
  avatarColor?: string;
  onStatusChange?: (id: string, isActive: boolean) => void;
  onEditClick?: (id: string) => void;
}

export const AgentCard = ({
  id,
  name,
  description,
  status,
  usagePercentage,
  lastUpdated,
  image,
  avatarLetter = "A",
  avatarColor = "bg-blue-100",
  onStatusChange,
  onEditClick,
}: AgentCardProps) => {
  const [isActive, setIsActive] = useState(status === "active");

  const handleStatusChange = (checked: boolean) => {
    setIsActive(checked);
    onStatusChange?.(id, checked);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500";
      case "pending": return "bg-amber-500";
      case "inactive": return "bg-gray-300";
      default: return "bg-gray-300";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active": return "Ativo";
      case "pending": return "Pendente";
      case "inactive": return "Inativo";
      default: return "Desconhecido";
    }
  };

  const statusColor = getStatusColor(status);
  const statusLabel = getStatusLabel(status);

  return (
    <Card className="hover:border-primary/30 transition-all duration-200 border-border/40">
      <CardContent className="p-0">
        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={cn("w-8 h-8 flex items-center justify-center rounded text-center", avatarColor)}>
                <span className="text-lg font-semibold">{avatarLetter}</span>
              </div>
              <div>
                <h3 className="font-medium">{name}</h3>
                <p className="text-xs text-muted-foreground">
                  Última atualização: {lastUpdated}
                </p>
              </div>
            </div>
            <Switch 
              checked={isActive} 
              onCheckedChange={handleStatusChange} 
              className="data-[state=checked]:bg-primary"
            />
          </div>
          
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        
        <div className="flex items-center mt-2 px-5 pb-5">
          <div className="flex items-center gap-2">
            <div className={cn("h-2 w-2 rounded-full", statusColor)} />
            <span className="text-xs text-muted-foreground">{statusLabel}</span>
          </div>
        </div>
        
        {usagePercentage > 0 && (
          <div 
            className="h-1 bg-primary"
            style={{ width: `${usagePercentage}%` }}
          />
        )}
      </CardContent>
    </Card>
  );
};

export const AgentCardSkeleton = () => (
  <Card className="border-border/40">
    <CardContent className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded" />
          <div>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-1 h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-4 w-8 rounded-full" />
      </div>
      
      <Skeleton className="h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-3/4" />
      
      <div className="mt-4">
        <Skeleton className="h-3 w-16" />
      </div>
    </CardContent>
  </Card>
);
