
"use client";

import { Phone, CalendarDays, BarChart3, User, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface CampaignCardProps {
  id: string;
  name: string;
  status: "active" | "paused" | "scheduled" | "completed";
  totalLeads: number;
  completedLeads: number;
  agent: string;
  lastActivity: string;
  avgCallDuration: string;
  successRate: number;
  startDate: string;
  endDate: string;
  onEditClick?: (id: string) => void;
  onViewDetails?: (id: string) => void;
}

export const CampaignCard = ({
  id,
  name,
  status,
  totalLeads,
  completedLeads,
  agent,
  lastActivity,
  avgCallDuration,
  successRate,
  startDate,
  endDate,
  onEditClick,
  onViewDetails
}: CampaignCardProps) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-0">Ativa</Badge>;
      case "paused":
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-0">Pausada</Badge>;
      case "scheduled":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-0">Agendada</Badge>;
      case "completed":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200 border-0">Concluída</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const progress = (completedLeads / totalLeads) * 100;

  return (
    <Card className="hover:border-primary/30 transition-all duration-300 hover:shadow-md hover:scale-[1.01] group">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-semibold">{name}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              {getStatusBadge(status)}
              <span className="text-xs text-muted-foreground">
                {startDate} - {endDate}
              </span>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground h-8 w-8"
            onClick={() => onEditClick && onEditClick(id)}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1 text-sm">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium">
                {Math.round(progress)}%
              </span>
            </div>
            <Progress 
              value={progress} 
              className="h-2 bg-gray-100" 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total de Leads</p>
              <div className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-violet-500" />
                <p className="font-semibold">{totalLeads}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Agente</p>
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-violet-500" />
                <p className="font-semibold">{agent}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Tempo Médio</p>
              <div className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-violet-500" />
                <p className="font-semibold">{avgCallDuration}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Taxa Sucesso</p>
              <div className="flex items-center gap-1.5">
                <BarChart3 className="h-3.5 w-3.5 text-violet-500" />
                <p className="font-semibold">{successRate}%</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0 flex justify-between">
        <div className="text-xs text-muted-foreground flex items-center">
          <CalendarDays className="w-3.5 h-3.5 mr-1 text-gray-400" />
          <span>Última atividade: {lastActivity}</span>
        </div>
        {onViewDetails && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-0 h-auto text-violet-600 hover:text-violet-800"
            onClick={() => onViewDetails(id)}
          >
            <span className="text-xs">Detalhes</span>
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
