
import { useState } from "react";
import { Settings, PhoneCall, Award, BarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/sonner";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AgentVoiceTester } from "./AgentVoiceTester";

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
  isTopPerformer?: boolean;
  voiceUsage?: {current: number, total: number}; // For voice usage progress
  voiceId?: string; // ID da voz do Eleven Labs
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
  isTopPerformer = id === "1", // Make first agent top performer by default
  voiceUsage = {current: 6, total: 10}, // Default voice usage values
  voiceId,
}: AgentCardProps) => {
  const [isActive] = useState(status === "active");
  const [showVoiceTester, setShowVoiceTester] = useState(false);

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
    }
    setShowVoiceTester(true);
  };

  const statusColor = getStatusColor(status);
  const statusDot = getStatusDot(status);
  const statusLabel = getStatusLabel(status);
  
  const usagePercentage = (voiceUsage.current / voiceUsage.total) * 100;

  return (
    <>
      <Card className="hover:border-primary/20 transition-all duration-300 border-border/40 hover:shadow-md hover:scale-[1.01] group">
        <div className="p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 flex items-center justify-center rounded-md text-center", avatarColor)}>
                <span className="text-lg font-semibold">{avatarLetter}</span>
              </div>
              <div>
                <div className="flex items-center">
                  <h3 className="font-medium text-lg">{name}</h3>
                  {isTopPerformer && (
                    <Badge className="ml-2 bg-amber-100 hover:bg-amber-200 text-amber-800 border-0 flex items-center gap-1 py-1">
                      <Award className="h-3 w-3" />
                      <span className="text-[10px]">Mais ativo hoje</span>
                    </Badge>
                  )}
                </div>
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
            <div className="flex items-center gap-1">
              <HoverCard>
                <HoverCardTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-muted-foreground h-8 w-8"
                  >
                    <BarChart className="h-4 w-4" />
                  </Button>
                </HoverCardTrigger>
                <HoverCardContent className="w-80">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Estatísticas detalhadas</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Total de chamadas</p>
                        <p className="font-medium">{calls}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Tempo médio</p>
                        <p className="font-medium">{avgTime}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Taxa de sucesso</p>
                        <p className="font-medium">{successRate}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Última atividade</p>
                        <p className="font-medium">{lastActivity || "Nunca usado"}</p>
                      </div>
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-muted-foreground h-8 w-8"
                onClick={() => onEditClick?.(id)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
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

          {/* Voice usage progress */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1 text-xs">
              <span className="text-muted-foreground">Uso de voz</span>
              <span className="font-medium">{voiceUsage.current}h de {voiceUsage.total}h</span>
            </div>
            <Progress value={usagePercentage} className="h-1.5 bg-gray-100" />
          </div>

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
            
            {/* Removendo o botão "Testar Voz" conforme solicitado */}
          </div>
        </div>
      </Card>

      <Dialog open={showVoiceTester} onOpenChange={setShowVoiceTester}>
        <DialogContent className="sm:max-w-[450px]">
          <AgentVoiceTester
            agentName={name}
            agentId={id}
            voiceId={voiceId}
            onClose={() => setShowVoiceTester(false)}
          />
        </DialogContent>
      </Dialog>
    </>
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
        <div className="flex gap-1">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
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

      <Skeleton className="h-1.5 w-full mb-1" />
      <div className="flex justify-between mb-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>

      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  </Card>
);
