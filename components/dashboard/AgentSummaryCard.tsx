
import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AgentCardProps } from "@/components/agents/AgentCard";

interface AgentSummaryCardProps {
  agent: AgentCardProps;
  onClick: (id: string) => void;
}

export function AgentSummaryCard({ agent, onClick }: AgentSummaryCardProps) {
  return (
    <Card
      key={agent.id}
      className="flex p-4 gap-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onClick(agent.id)}
    >
      <div
        className={`${agent.avatarColor} h-12 w-12 rounded-full flex items-center justify-center font-medium text-lg`}
      >
        {agent.avatarLetter}
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold">{agent.name}</h3>
            <p className="text-sm text-muted-foreground">{agent.category}</p>
          </div>
          <Badge
            variant={
              agent.status === "active"
                ? "success"
                : agent.status === "paused"
                ? "warning"
                : "outline"
            }
          >
            {agent.status === "active"
              ? "Ativo"
              : agent.status === "paused"
              ? "Pausado"
              : "Inativo"}
          </Badge>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-1">
          <div>
            <p className="text-xs text-muted-foreground">Chamadas</p>
            <p className="font-semibold">{agent.calls}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Sucesso</p>
            <p className="font-semibold">{agent.successRate}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tempo Médio</p>
            <p className="font-semibold">{agent.avgTime}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
