import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { MoreVertical, Edit, Mic, Phone, MessageSquare } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export interface AgentCardProps {
  id: string;
  name: string;
  category: string;
  description: string;
  status: "active" | "paused" | "inactive";
  type?: "text" | "voice"; // Adicionar campo type
  calls: number;
  avgTime: string;
  successRate: number;
  successChange: string;
  lastActivity: string;
  avatarLetter: string;
  avatarColor: string;
  voiceId?: string;
  voiceUsage?: {
    current: number;
    total: number;
  };
  onStatusChange?: (id: string, isActive: boolean) => void;
  onEditClick?: (id: string) => void;
  onTestVoice?: (id: string) => void;
  onTestCall?: (id: string) => void;
}

export function AgentCard({ 
  id, 
  name, 
  category, 
  description, 
  status, 
  type = "voice", // Default para voice
  calls, 
  avgTime, 
  successRate, 
  successChange, 
  lastActivity, 
  avatarLetter, 
  avatarColor, 
  voiceUsage,
  onStatusChange,
  onEditClick,
  onTestVoice,
  onTestCall
}: AgentCardProps) {
  const isActive = status === "active";
  const isPaused = status === "paused";
  
  const handleStatusToggle = () => {
    const newStatus = isActive ? false : true;
    onStatusChange?.(id, newStatus);
  };

  const handleEditClick = () => {
    onEditClick?.(id);
  };

  const handleTestVoice = () => {
    onTestVoice?.(id);
  };

  const handleTestCall = () => {
    onTestCall?.(id);
  };

  // Função para obter a badge de status
  const getStatusBadge = () => {
    if (status === "active") {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-0">Ativo</Badge>;
    }
    if (status === "paused") {
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-0">Pausado</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200 border-0">Inativo</Badge>;
  };

  // Função para obter a badge de tipo
  const getTypeBadge = () => {
    if (type === "text") {
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-0 flex items-center gap-1">
          <MessageSquare className="h-3 w-3" />
          Texto
        </Badge>
      );
    }
    return (
      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-0 flex items-center gap-1">
        <Mic className="h-3 w-3" />
        Voz
      </Badge>
    );
  };

  return (
    <Card className="h-full hover:shadow-apple-hover transition-all duration-200 hover:scale-[1.01] border-gray-100 rounded-xl overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className={`h-12 w-12 ${avatarColor} border-2 border-white shadow-sm`}>
              <AvatarFallback className="text-lg font-semibold text-apple-text-primary bg-transparent">
                {avatarLetter}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-apple-text-primary line-clamp-1">{name}</h3>
              <p className="text-sm text-apple-text-secondary">{category}</p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 hover:bg-gray-100 rounded-lg"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleEditClick} className="flex items-center">
                <Edit className="mr-2 h-4 w-4" />
                Editar agente
              </DropdownMenuItem>
              {type === "voice" && onTestVoice && (
                <DropdownMenuItem onClick={handleTestVoice} className="flex items-center">
                  <Mic className="mr-2 h-4 w-4" />
                  Testar voz
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleTestCall} className="flex items-center">
                <Phone className="mr-2 h-4 w-4" />
                {type === "text" ? "Testar chat" : "Testar chamada"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <p className="text-sm text-apple-text-secondary line-clamp-2 leading-relaxed mt-2">
          {description}
        </p>
        
        <div className="flex items-center justify-between mt-3">
          <div className="flex gap-2">
            {getStatusBadge()}
            {getTypeBadge()}
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-xs text-apple-text-secondary">
              {isActive ? "Ativo" : isPaused ? "Pausado" : "Inativo"}
            </span>
            <Switch 
              checked={isActive} 
              onCheckedChange={handleStatusToggle}
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-4">
        {/* Métricas em grid 2x2 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <p className="text-xs text-apple-text-secondary">Chamadas</p>
            <p className="text-lg font-semibold text-apple-text-primary">{calls.toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-apple-text-secondary">Média</p>
            <p className="text-lg font-semibold text-apple-text-primary">{avgTime}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-apple-text-secondary">Taxa sucesso</p>
            <div className="flex items-center gap-1">
              <p className="text-lg font-semibold text-apple-text-primary">{successRate}%</p>
              <span className="text-xs text-green-600 font-medium">{successChange}</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-apple-text-secondary">Último uso</p>
            <p className="text-xs text-apple-text-primary font-medium">{lastActivity}</p>
          </div>
        </div>
        
        {/* Barra de uso da voz (apenas para agentes de voz) */}
        {type === "voice" && voiceUsage && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-apple-text-secondary">Uso da voz</span>
              <span className="text-xs text-apple-text-secondary">
                {voiceUsage.current}/{voiceUsage.total} min
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary-apple h-2 rounded-full transition-all duration-300" 
                style={{ width: `${(voiceUsage.current / voiceUsage.total) * 100}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function AgentCardSkeleton() {
  return (
    <Card className="h-full animate-pulse border-gray-100 rounded-xl overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
            <div className="space-y-2">
              <div className="h-5 bg-gray-200 rounded w-32"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
          <div className="h-8 w-8 bg-gray-200 rounded"></div>
        </div>
        
        <div className="space-y-2 mt-2">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
        
        <div className="flex items-center justify-between mt-3">
          <div className="flex gap-2">
            <div className="h-6 bg-gray-200 rounded-full w-16"></div>
            <div className="h-6 bg-gray-200 rounded-full w-12"></div>
          </div>
          <div className="h-5 w-9 bg-gray-200 rounded-full"></div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {Array(4).fill(null).map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="h-3 bg-gray-200 rounded w-12"></div>
              <div className="h-5 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <div className="h-3 bg-gray-200 rounded w-16"></div>
            <div className="h-3 bg-gray-200 rounded w-12"></div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2"></div>
        </div>
      </CardContent>
    </Card>
  );
}
