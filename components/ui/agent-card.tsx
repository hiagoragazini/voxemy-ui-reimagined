
"use client";

import { useState } from "react";
import { Clock, CheckCircle2, XCircle, BarChart3, Phone, Play, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";

export interface AgentCardProps {
  id: string;
  name: string;
  description: string;
  category: string;
  status: "active" | "paused" | "inactive";
  calls: number;
  avgTime: string;
  successRate: number;
  successChange?: string;
  lastActivity: string;
  isTopPerformer?: boolean;
  avatarLetter?: string;
  avatarColor?: string;
  avatarUrl?: string;
  voiceUsage?: {
    current: number;
    total: number;
  };
  onEditClick?: (id: string) => void;
  onStatusChange?: (id: string, isActive: boolean) => void;
  onTestVoice?: (id: string) => void;
}

export const AgentCard = ({
  id,
  name,
  description,
  category,
  status,
  calls,
  avgTime,
  successRate,
  lastActivity,
  isTopPerformer,
  avatarLetter,
  avatarColor,
  voiceUsage,
  onEditClick,
  onStatusChange,
  onTestVoice
}: AgentCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleStatusToggle = () => {
    if (onStatusChange) {
      onStatusChange(id, status !== "active");
    }
  };

  return (
    <Card className={`border-border/40 hover:border-primary/30 transition-all duration-300 hover:shadow-md hover:scale-[1.01] relative ${isTopPerformer ? 'ring-2 ring-violet-300 ring-offset-2' : ''}`}>
      {isTopPerformer && (
        <Badge className="absolute -top-2 -right-2 bg-violet-600">Top Performer</Badge>
      )}
      
      <div className="p-5">
        <div className="flex items-start gap-3">
          <Avatar className={`h-10 w-10 ${avatarColor || 'bg-violet-100'}`}>
            <AvatarFallback className="text-violet-600">
              {avatarLetter || name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-lg">{name}</h3>
              <Switch 
                checked={status === "active"}
                onCheckedChange={handleStatusToggle}
              />
            </div>
            
            <div className="flex items-center gap-2 mb-1">
              <Badge 
                variant="outline"
                className="font-normal text-xs bg-violet-50 text-violet-700 border-violet-200"
              >
                {category}
              </Badge>
              
              {status === "active" && (
                <Badge
                  className="bg-green-100 text-green-800 border-0 font-normal"
                >
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Ativo</span>
                  </div>
                </Badge>
              )}
              
              {status === "paused" && (
                <Badge
                  className="bg-amber-100 text-amber-800 border-0 font-normal"
                >
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>Pausado</span>
                  </div>
                </Badge>
              )}
              
              {status === "inactive" && (
                <Badge
                  className="bg-gray-100 text-gray-700 border-0 font-normal"
                >
                  <div className="flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    <span>Inativo</span>
                  </div>
                </Badge>
              )}
            </div>
            
            <p className={`text-sm text-muted-foreground ${isExpanded ? '' : 'line-clamp-2'}`}>
              {description}
            </p>
            
            {description && description.length > 100 && (
              <button
                className="text-xs text-violet-600 mt-1 hover:text-violet-800 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? 'Ver menos' : 'Ver mais'}
              </button>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="border rounded-md p-2 flex flex-col items-center justify-center">
            <Phone className="h-4 w-4 text-violet-600 mb-1" />
            <p className="text-sm font-medium">{calls}</p>
            <p className="text-xs text-muted-foreground">Chamadas</p>
          </div>
          
          <div className="border rounded-md p-2 flex flex-col items-center justify-center">
            <Clock className="h-4 w-4 text-violet-600 mb-1" />
            <p className="text-sm font-medium">{avgTime}</p>
            <p className="text-xs text-muted-foreground">Tempo Méd.</p>
          </div>
          
          <div className="border rounded-md p-2 flex flex-col items-center justify-center">
            <BarChart3 className="h-4 w-4 text-violet-600 mb-1" />
            <p className="text-sm font-medium">{successRate}%</p>
            <p className="text-xs text-muted-foreground">Sucesso</p>
          </div>
        </div>
        
        {voiceUsage && (
          <div className="mt-3">
            <div className="flex justify-between items-center mb-1 text-xs text-muted-foreground">
              <span>Uso de Voz</span>
              <span>{voiceUsage.current}/{voiceUsage.total} horas</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div
                className="bg-violet-600 h-1.5 rounded-full"
                style={{ width: `${(voiceUsage.current / voiceUsage.total) * 100}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
      
      <CardFooter className="border-t px-5 py-3 flex justify-between">
        <div className="text-xs text-muted-foreground flex items-center">
          <Clock className="w-3.5 h-3.5 mr-1 text-gray-400" />
          <span>{lastActivity || "Nunca utilizado"}</span>
        </div>
        
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-violet-600"
            onClick={() => onTestVoice && onTestVoice(id)}
          >
            <Play className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-violet-600"
            onClick={() => onEditClick && onEditClick(id)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export const AgentCardSkeleton = () => {
  return (
    <Card className="border-border/40">
      <div className="p-5">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse"></div>
          <div className="flex-1">
            <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse mt-1"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="border rounded-md p-2 flex flex-col items-center justify-center">
            <div className="h-4 w-4 bg-gray-200 rounded animate-pulse mb-1"></div>
            <div className="h-5 w-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mt-1"></div>
          </div>
          <div className="border rounded-md p-2 flex flex-col items-center justify-center">
            <div className="h-4 w-4 bg-gray-200 rounded animate-pulse mb-1"></div>
            <div className="h-5 w-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mt-1"></div>
          </div>
          <div className="border rounded-md p-2 flex flex-col items-center justify-center">
            <div className="h-4 w-4 bg-gray-200 rounded animate-pulse mb-1"></div>
            <div className="h-5 w-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mt-1"></div>
          </div>
        </div>
      </div>
      
      <CardFooter className="border-t px-5 py-3 flex justify-between">
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
      </CardFooter>
    </Card>
  );
};
