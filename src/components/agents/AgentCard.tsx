
import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Edit, Phone, Smartphone, User } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AgentCardProps {
  id: string;
  name: string;
  category: string;
  description?: string;
  status: "active" | "paused" | "inactive";
  voiceId?: string;
  calls?: number;
  avgTime?: string;
  successRate?: number;
  successChange?: string;
  lastActivity?: string;
  avatarLetter?: string;
  avatarColor?: string;
  isTopPerformer?: boolean;
  voiceUsage?: { current: number; total: number };
  onStatusChange?: (id: string, isActive: boolean) => void;
  onEditClick?: (id: string) => void;
  onTestVoice?: (id: string) => void;
  onTestCall?: (id: string) => void;
}

// Skeleton component for loading state
export const AgentCardSkeleton = () => {
  return (
    <Card className="border shadow-sm h-72">
      <CardHeader className="pb-2 space-y-0">
        <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse mb-2"></div>
        <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse"></div>
      </CardHeader>
      <CardContent className="py-2">
        <div className="h-3 w-3/4 bg-gray-200 rounded animate-pulse mb-3"></div>
        <div className="h-3 w-full bg-gray-200 rounded animate-pulse mb-4"></div>
        <div className="space-y-2">
          <div className="h-2.5 w-full bg-gray-200 rounded animate-pulse"></div>
          <div className="h-6 w-full bg-gray-200 rounded animate-pulse"></div>
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export const AgentCard = ({
  id,
  name,
  category,
  description,
  status,
  voiceId,
  calls = 0,
  avgTime = "0:00",
  successRate = 0,
  successChange = "0%",
  lastActivity = "--",
  avatarLetter = "A",
  avatarColor = "bg-gray-100",
  voiceUsage,
  onStatusChange,
  onEditClick,
  onTestVoice,
  onTestCall,
}: AgentCardProps) => {
  const [isActive, setIsActive] = useState(status === "active");

  const handleStatusChange = (isChecked: boolean) => {
    setIsActive(isChecked);
    if (onStatusChange) {
      onStatusChange(id, isChecked);
    }
  };

  const handleEditClick = () => {
    if (onEditClick) {
      onEditClick(id);
    }
  };

  const handleTestVoice = () => {
    if (onTestVoice) {
      onTestVoice(id);
    }
  };

  const handleTestCall = () => {
    if (onTestCall) {
      onTestCall(id);
    }
  };

  return (
    <Card className={cn(
      "border hover:shadow-md hover:border-blue-800/20 transition-all duration-300 relative",
      status === "inactive" && "opacity-70"
    )}>
      <CardHeader className="flex flex-row items-start justify-between pb-1 space-y-0">
        <div className="flex items-center gap-2">
          <div className={`flex items-center justify-center rounded-full w-8 h-8 text-sm font-medium ${avatarColor} text-black/70`}>
            {avatarLetter}
          </div>
          <div>
            <h3 className="font-medium text-base">{name}</h3>
            <p className="text-muted-foreground text-xs">{category}</p>
          </div>
        </div>
        <Switch 
          checked={isActive}
          onCheckedChange={handleStatusChange}
          className="data-[state=checked]:bg-blue-600"
        />
      </CardHeader>
      <CardContent className="pb-2">
        {description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {description}
          </p>
        )}

        {voiceUsage && (
          <div>
            <div className="flex justify-between mb-1 text-xs">
              <span className="text-muted-foreground">Uso mensal da voz</span>
              <span className="font-medium">
                {voiceUsage.current}/{voiceUsage.total}
              </span>
            </div>
            <Progress 
              value={(voiceUsage.current / voiceUsage.total) * 100} 
              className="h-1.5 bg-gray-100" 
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Chamadas</p>
            <p className="font-semibold">{calls}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Média</p>
            <p className="font-semibold">{avgTime}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Taxa sucesso</p>
            <div className="flex items-center">
              <p className="font-semibold">{successRate}%</p>
              {successChange.startsWith('+') && (
                <span className="text-xs text-green-600 ml-1">{successChange}</span>
              )}
              {successChange.startsWith('-') && (
                <span className="text-xs text-red-600 ml-1">{successChange}</span>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Atividade</p>
            <p className="font-semibold text-sm">{lastActivity}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0 flex justify-between">
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8"
            onClick={handleEditClick}
          >
            <Edit className="h-3.5 w-3.5 mr-1" />
            Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8"
            onClick={handleTestCall}
          >
            <Phone className="h-3.5 w-3.5 mr-1" />
            Ligar
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
