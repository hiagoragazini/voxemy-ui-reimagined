
"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Phone, Clock, Calendar, BarChart3, CheckCircle2 } from "lucide-react";
import { CampaignActions } from "@/components/campaign/CampaignActions";

interface CampaignCardProps {
  id: string;
  name: string;
  status: "active" | "paused" | "scheduled" | "completed";
  totalLeads: number;
  completedLeads: number;
  agent: string;
  agentId?: string;
  lastActivity: string;
  avgCallDuration: string;
  successRate: number;
  startDate: string;
  endDate: string;
  onEditClick?: (id: string) => void;
  onViewDetails?: (id: string) => void;
}

export function CampaignCard({
  id,
  name,
  status,
  totalLeads,
  completedLeads,
  agent,
  agentId,
  lastActivity,
  avgCallDuration,
  successRate,
  startDate,
  endDate,
  onEditClick,
  onViewDetails
}: CampaignCardProps) {
  const completionPercentage = Math.round((completedLeads / totalLeads) * 100) || 0;
  
  return (
    <Card className="relative overflow-hidden hover:shadow-md transition-all duration-300 hover:border-primary/30">
      <div className="p-5">
        {/* Status badge */}
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-medium">{name}</h3>
          {status === "active" && (
            <Badge className="bg-green-100 text-green-800 border-0 font-normal">
              <div className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                <span>Active</span>
              </div>
            </Badge>
          )}
          {status === "paused" && (
            <Badge className="bg-amber-100 text-amber-800 border-0 font-normal">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Paused</span>
              </div>
            </Badge>
          )}
          {status === "scheduled" && (
            <Badge className="bg-blue-100 text-blue-800 border-0 font-normal">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>Scheduled</span>
              </div>
            </Badge>
          )}
          {status === "completed" && (
            <Badge className="bg-gray-100 text-gray-800 border-0 font-normal">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                <span>Completed</span>
              </div>
            </Badge>
          )}
        </div>
        
        {/* Agent info */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">Agent: <span className="font-medium text-foreground">{agent}</span></p>
        </div>
        
        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-muted-foreground">Progress</span>
            <span className="text-xs font-medium">{completedLeads} of {totalLeads} leads ({completionPercentage}%)</span>
          </div>
          <Progress value={completionPercentage} className="h-1.5 bg-gray-100" />
        </div>
        
        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="border rounded-md p-2 flex flex-col items-center justify-center">
            <BarChart3 className="h-4 w-4 text-violet-600 mb-1" />
            <p className="text-sm font-medium">{successRate}%</p>
            <p className="text-xs text-muted-foreground">Success</p>
          </div>
          <div className="border rounded-md p-2 flex flex-col items-center justify-center">
            <Clock className="h-4 w-4 text-violet-600 mb-1" />
            <p className="text-sm font-medium">{avgCallDuration}</p>
            <p className="text-xs text-muted-foreground">Avg Time</p>
          </div>
          <div className="border rounded-md p-2 flex flex-col items-center justify-center">
            <Calendar className="h-4 w-4 text-violet-600 mb-1" />
            <p className="text-sm font-medium">{startDate}</p>
            <p className="text-xs text-muted-foreground">Start Date</p>
          </div>
        </div>
        
        {/* Last activity and action buttons */}
        <div className="flex justify-between items-center">
          <div className="text-xs text-muted-foreground">
            <span>Last activity: {lastActivity}</span>
          </div>
          
          <CampaignActions
            campaignId={id}
            campaignName={name}
            agentId={agentId}
            agentName={agent}
            onEditClick={onEditClick}
            onViewDetails={onViewDetails}
          />
        </div>
      </div>
    </Card>
  );
}
