import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { MoreVertical, Edit, Mic, Phone, MessageSquare, ArrowLeftRight, Trash2, Copy, PlayCircle, PauseCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DeleteAgentDialog } from "./DeleteAgentDialog";
import { useAgentOperations } from "@/hooks/use-agent-operations";

export interface AgentCardProps {
  id: string;
  name: string;
  category: string;
  description: string;
  status: "active" | "paused" | "inactive";
  type?: "text" | "voice" | "hybrid";
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
  // Métricas específicas para agentes híbridos
  whatsappMessages?: number;
  voiceCalls?: number;
  textTokens?: string;
  voiceTokens?: string;
  onStatusChange?: (id: string, isActive: boolean) => void;
  onEditClick?: (id: string) => void;
  onTestVoice?: (id: string) => void;
  onTestCall?: (id: string) => void;
  onRefresh?: () => void;
}

export function AgentCard({ 
  id, 
  name, 
  category, 
  description, 
  status, 
  type = "voice",
  calls, 
  avgTime, 
  successRate, 
  successChange, 
  lastActivity, 
  avatarLetter, 
  avatarColor, 
  voiceUsage,
  whatsappMessages,
  voiceCalls,
  textTokens,
  voiceTokens,
  onStatusChange,
  onEditClick,
  onTestVoice,
  onTestCall,
  onRefresh
}: AgentCardProps) {
  const isActive = status === "active";
  const isPaused = status === "paused";
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const { deleteAgent, duplicateAgent, toggleAgentStatus, isDeleting, isDuplicating } = useAgentOperations();
  
  const handleStatusToggle = async () => {
    const newStatus = await toggleAgentStatus(id, status, name);
    if (newStatus !== status && onStatusChange) {
      onStatusChange(id, newStatus === 'active');
    }
    if (onRefresh) {
      onRefresh();
    }
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

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    const success = await deleteAgent(id, name);
    if (success && onRefresh) {
      onRefresh();
    }
    setShowDeleteDialog(false);
  };

  const handleDuplicate = async () => {
    await duplicateAgent(id);
    if (onRefresh) {
      onRefresh();
    }
  };

  const handleMenuStatusToggle = async () => {
    await handleStatusToggle();
  };

  // Função para obter labels das métricas baseado no tipo do agente
  const getMetricsLabels = () => {
    if (type === "text") {
      return {
        interactions: "Mensagens",
        avgTimeLabel: "Tokens médios",
        successLabel: "Taxa de resolução"
      };
    }
    if (type === "hybrid") {
      return {
        interactions: "Interações totais",
        avgTimeLabel: "Tokens totais",
        successLabel: "Taxa de sucesso"
      };
    }
    return {
      interactions: "Chamadas",
      avgTimeLabel: "Tokens médios",
      successLabel: "Taxa de conversão"
    };
  };

  const metricsLabels = getMetricsLabels();

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
    if (type === "hybrid") {
      return (
        <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200 border-0 flex items-center gap-1">
          <ArrowLeftRight className="h-3 w-3" />
          Híbrido
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

  // Renderizar métricas baseado no tipo
  const renderMetrics = () => {
    if (type === "hybrid") {
      // Layout especial 2x3 para agentes híbridos
      return (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <p className="text-xs text-apple-text-secondary">Mensagens WhatsApp</p>
            <p className="text-lg font-semibold text-apple-text-primary">{whatsappMessages?.toLocaleString() || '0'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-apple-text-secondary">Chamadas de voz</p>
            <p className="text-lg font-semibold text-apple-text-primary">{voiceCalls?.toLocaleString() || '0'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-apple-text-secondary">Tokens texto</p>
            <p className="text-lg font-semibold text-apple-text-primary">{textTokens || '0'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-apple-text-secondary">Tokens voz</p>
            <p className="text-lg font-semibold text-apple-text-primary">{voiceTokens || '0'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-apple-text-secondary">{metricsLabels.successLabel}</p>
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
      );
    }

    // Layout padrão 2x2 para agentes de texto e voz
    return (
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <p className="text-xs text-apple-text-secondary">{metricsLabels.interactions}</p>
          <p className="text-lg font-semibold text-apple-text-primary">{calls.toLocaleString()}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-apple-text-secondary">{metricsLabels.avgTimeLabel}</p>
          <p className="text-lg font-semibold text-apple-text-primary">{avgTime}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-apple-text-secondary">{metricsLabels.successLabel}</p>
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
    );
  };

  return (
    <>
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
                
                <DropdownMenuItem onClick={handleDuplicate} className="flex items-center" disabled={isDuplicating}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicar agente
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                {(type === "voice" || type === "hybrid") && onTestVoice && (
                  <DropdownMenuItem onClick={handleTestVoice} className="flex items-center">
                    <Mic className="mr-2 h-4 w-4" />
                    Testar voz
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuItem onClick={handleTestCall} className="flex items-center">
                  {type === "text" ? (
                    <>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Testar Chat
                    </>
                  ) : type === "hybrid" ? (
                    <>
                      <ArrowLeftRight className="mr-2 h-4 w-4" />
                      Testar Híbrido
                    </>
                  ) : (
                    <>
                      <Phone className="mr-2 h-4 w-4" />
                      Testar Chamada
                    </>
                  )}
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={handleMenuStatusToggle} className="flex items-center">
                  {isActive ? (
                    <>
                      <PauseCircle className="mr-2 h-4 w-4" />
                      Pausar agente
                    </>
                  ) : (
                    <>
                      <PlayCircle className="mr-2 h-4 w-4" />
                      Ativar agente
                    </>
                  )}
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={handleDeleteClick} className="flex items-center text-red-600 hover:text-red-700">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir agente
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
          {renderMetrics()}
          
          {voiceUsage && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-apple-text-secondary">
                  {type === "hybrid" ? "Uso de tokens combinado" : "Uso de tokens"}
                </span>
                <span className="text-xs text-apple-text-secondary">
                  {voiceUsage.current}K/{voiceUsage.total}K
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
          
          {/* Direct action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={handleEditClick}
              className="flex items-center gap-1 text-xs"
            >
              <Edit className="h-3 w-3" />
              Editar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteClick}
              className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
            >
              <Trash2 className="h-3 w-3" />
              Excluir
            </Button>
          </div>
        </CardContent>
      </Card>

      <DeleteAgentDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        agentName={name}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </>
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
        
        <div className="flex items-center justify-end gap-2 pt-2 border-t">
          <div className="h-8 bg-gray-200 rounded w-16"></div>
          <div className="h-8 bg-gray-200 rounded w-16"></div>
        </div>
      </CardContent>
    </Card>
  );
}
