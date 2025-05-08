
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CampaignCallTester } from "./CampaignCallTester";
import { Phone, Settings, BarChart3 } from "lucide-react";

interface CampaignActionsProps {
  campaignId: string;
  campaignName: string;
  agentId?: string;
  agentName?: string;
  onEditClick?: (id: string) => void;
  onViewDetails?: (id: string) => void;
}

export function CampaignActions({
  campaignId,
  campaignName,
  agentId,
  agentName,
  onEditClick,
  onViewDetails
}: CampaignActionsProps) {
  const [showCallTester, setShowCallTester] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1.5 text-xs"
          onClick={() => setShowCallTester(true)}
        >
          <Phone className="h-3 w-3" />
          <span>Testar Chamada</span>
        </Button>
        
        {onViewDetails && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onViewDetails(campaignId)}
          >
            <BarChart3 className="h-4 w-4" />
          </Button>
        )}
        
        {onEditClick && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEditClick(campaignId)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <Dialog open={showCallTester} onOpenChange={setShowCallTester}>
        <DialogContent className="sm:max-w-[450px]">
          <CampaignCallTester
            campaignId={campaignId}
            agentId={agentId}
            agentName={agentName || "Agente"}
            onClose={() => setShowCallTester(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
