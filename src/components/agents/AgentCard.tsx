
import { useState } from "react";
import { Settings, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/sonner";
import { Progress } from "@/components/ui/progress";

export interface AgentCardProps {
  id: string;
  name: string;
  description?: string;
  category?: string;
  status: "active" | "inactive" | "pending" | "paused";
  calls?: number;
  avgTime?: string;
  successRate?: number;
  lastActivity?: string;
  avatarLetter?: string;
  avatarColor?: string;
  successChange?: string;
  onStatusChange?: (id: string, isActive: boolean) => void;
  onEditClick?: (id: string) => void;
  onTestVoice?: (id: string) => void;
}

export const AgentCard = ({
  id,
  name,
  description = "",
  category = "",
  status,
  calls = 0,
  avgTime = "0:00",
  successRate = 0,
  lastActivity = "",
  avatarLetter = "A",
  avatarColor = "bg-violet-200",
  successChange = "+5.2%",
  onStatusChange,
  onEditClick,
  onTestVoice,
}: AgentCardProps) => {
  const [isActive] = useState(status === "active");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "text-green-700";
      case "paused": return "text-amber-600";
      case "inactive": return "text-gray-500";
      default: return "text-gray-500";
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500";
      case "paused": return "bg-amber-500";
      case "inactive": return "bg-gray-400";
      default: return "bg-gray-400";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active": return "Ativo";
      case "paused": return "Pausado";
      case "inactive": return "Inativo";
      default: return "Desconhecido";
    }
  };

  const handleTestVoice = () => {
    if (onTestVoice) {
      onTestVoice(id);
    } else {
      toast.success(`Teste de voz iniciado para ${name}`);
    }
  };

  const statusColor = getStatusColor(status);
  const statusDot = getStatusDot(status);
  const statusLabel = getStatusLabel(status);

  return (
    <Card className="hover:border-primary/20 transition-all duration-200 border-border/40">
      <div className="p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 flex items-center justify-center rounded-md text-center", avatarColor)}>
              <span className="text-lg font-semibold">{avatarLetter}</span>
            </div>
            <div>
              <h3 className="font-medium text-lg">{name}</h3>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>{category}</span>
                {category && status && <span className="mx-1">•</span>}
                <div className="flex items-center">
                  <div className={cn("h-1.5 w-1.5 rounded-full mr-1", statusDot)} />
                  <span className={statusColor}>{statusLabel}</span>
                </div>
              </div>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground"
            onClick={() => onEditClick?.(id)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        {description && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
          </div>
        )}
        
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Chamadas</p>
            <p className="font-semibold">{calls}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Tempo Médio</p>
            <p className="font-semibold">{avgTime}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Taxa Sucesso</p>
            <div className="flex items-center">
              <p className="font-semibold">{successRate}%</p>
              <span className="text-xs text-green-600 ml-1">{successChange}</span>
            </div>
          </div>
        </div>

        {successRate > 0 && (
          <div className="mb-4">
            <Progress value={successRate} className="h-1.5 bg-gray-100" />
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground flex items-center">
            {lastActivity && (
              <>
                <svg className="w-3.5 h-3.5 mr-1 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{lastActivity}</span>
              </>
            )}
            {!lastActivity && 'Nunca usado'}
          </div>
          <Button 
            size="sm" 
            variant="default"
            className="bg-violet-600 hover:bg-violet-700 text-white"
            onClick={handleTestVoice}
          >
            <PhoneCall className="h-3 w-3 mr-1" /> 
            Testar Voz
          </Button>
        </div>
      </div>
    </Card>
  );
};

export const AgentCardSkeleton = () => (
  <Card className="border-border/40">
    <div className="p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div>
            <Skeleton className="h-5 w-32 mb-1" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
      
      <Skeleton className="h-4 w-full mb-4" />
      
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <Skeleton className="h-3 w-16 mb-1" />
          <Skeleton className="h-5 w-10" />
        </div>
        <div>
          <Skeleton className="h-3 w-16 mb-1" />
          <Skeleton className="h-5 w-10" />
        </div>
        <div>
          <Skeleton className="h-3 w-16 mb-1" />
          <Skeleton className="h-5 w-20" />
        </div>
      </div>

      <Skeleton className="h-1.5 w-full mb-4" />

      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>
    </div>
  </Card>
);

