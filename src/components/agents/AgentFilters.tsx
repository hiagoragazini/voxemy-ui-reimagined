
import React from "react";
import { Button } from "@/components/ui/button";
import { Filter, UserCheck, UserX, Clock, RefreshCcw, MessageSquare, Mic } from "lucide-react";
import { AgentCardProps } from "@/components/agents/AgentCard";

interface AgentFiltersProps {
  filter: "all" | "active" | "paused" | "inactive";
  setFilter: (filter: "all" | "active" | "paused" | "inactive") => void;
  typeFilter: "all" | "text" | "voice";
  setTypeFilter: (filter: "all" | "text" | "voice") => void;
  agents: AgentCardProps[];
  onRefresh: () => void;
  isRefreshing: boolean;
  onDiagnose: () => void;
  isDiagnosing: boolean;
}

export function AgentFilters({
  filter,
  setFilter,
  typeFilter,
  setTypeFilter,
  agents,
  onRefresh,
  isRefreshing,
  onDiagnose,
  isDiagnosing
}: AgentFiltersProps) {
  const getFilterCount = (filterType: "active" | "paused" | "inactive") => {
    return agents.filter(agent => agent.status === filterType).length;
  };

  const getTypeFilterCount = (agentType: "text" | "voice") => {
    return agents.filter(agent => agent.type === agentType).length;
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Filtros por Status */}
      <Button 
        variant={filter === "all" ? "default" : "outline"} 
        size="sm"
        onClick={() => setFilter("all")}
        className="flex items-center gap-1.5"
      >
        <Filter className="h-4 w-4" />
        <span>Todos ({agents.length})</span>
      </Button>
      <Button 
        variant={filter === "active" ? "default" : "outline"} 
        size="sm"
        onClick={() => setFilter("active")}
        className="flex items-center gap-1.5"
      >
        <UserCheck className="h-4 w-4 text-green-500" />
        <span>Ativos ({getFilterCount("active")})</span>
      </Button>
      <Button 
        variant={filter === "paused" ? "default" : "outline"} 
        size="sm"
        onClick={() => setFilter("paused")}
        className="flex items-center gap-1.5"
      >
        <Clock className="h-4 w-4 text-amber-500" />
        <span>Pausados ({getFilterCount("paused")})</span>
      </Button>
      <Button 
        variant={filter === "inactive" ? "default" : "outline"} 
        size="sm"
        onClick={() => setFilter("inactive")}
        className="flex items-center gap-1.5"
      >
        <UserX className="h-4 w-4 text-gray-500" />
        <span>Inativos ({getFilterCount("inactive")})</span>
      </Button>

      {/* Separador visual */}
      <div className="h-6 w-px bg-gray-300 mx-2" />

      {/* Filtros por Tipo */}
      <Button 
        variant={typeFilter === "text" ? "default" : "outline"} 
        size="sm"
        onClick={() => setTypeFilter("text")}
        className="flex items-center gap-1.5"
      >
        <MessageSquare className="h-4 w-4 text-green-500" />
        <span>Texto ({getTypeFilterCount("text")})</span>
      </Button>
      <Button 
        variant={typeFilter === "voice" ? "default" : "outline"} 
        size="sm"
        onClick={() => setTypeFilter("voice")}
        className="flex items-center gap-1.5"
      >
        <Mic className="h-4 w-4 text-blue-500" />
        <span>Voz ({getTypeFilterCount("voice")})</span>
      </Button>
      
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          <RefreshCcw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Atualizar</span>
        </Button>
        
        <Button
          variant="secondary"
          size="sm"
          onClick={onDiagnose}
          disabled={isDiagnosing}
        >
          {isDiagnosing ? 
            <span className="flex items-center">
              <RefreshCcw className="h-4 w-4 mr-1 animate-spin" />
              Diagnosticando...
            </span> : 
            "Diagnosticar problemas"
          }
        </Button>
      </div>
    </div>
  );
}
