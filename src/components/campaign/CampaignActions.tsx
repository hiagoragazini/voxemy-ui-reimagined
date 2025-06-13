import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { RunCampaignButton } from "@/components/campaign/RunCampaignButton";
import { PencilLine, MoreVertical, Trash2, Phone, Copy, SquarePen, FileSpreadsheet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Papa from "papaparse";

interface CampaignActionsProps {
  campaignId: string;
  campaignName: string;
  agentId?: string;
  agentName?: string;
  totalLeads?: number;
  pendingLeads?: number;
  onEditClick: () => void;
  onCampaignRun?: () => void;
}

export function CampaignActions({ 
  campaignId, 
  campaignName, 
  agentId,
  agentName,
  totalLeads = 0,
  pendingLeads = 0,
  onEditClick,
  onCampaignRun
}: CampaignActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const handleDeleteCampaign = async () => {
    try {
      setIsDeleting(true);
      
      // Delete all leads associated with the campaign first
      const { error: leadsError } = await supabase
        .from('leads')
        .delete()
        .eq('campaign_id', campaignId);
      
      if (leadsError) throw leadsError;
      
      // Then delete the campaign itself
      const { error: campaignError } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaignId);
        
      if (campaignError) throw campaignError;
      
      toast.success("Campanha excluída com sucesso");
      
      // Navigate back to campaigns list
      window.location.href = "/campaigns";
    } catch (err: any) {
      console.error("Error deleting campaign:", err);
      toast.error("Erro ao excluir campanha: " + (err.message || "Erro desconhecido"));
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleDuplicateCampaign = async () => {
    try {
      // Fetch the campaign data
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();
        
      if (campaignError) throw campaignError;
      
      // Create a new campaign with the same data but different name
      const newCampaign = {
        ...campaignData,
        id: undefined, // Let the database generate a new ID
        name: `${campaignData.name} (Cópia)`,
        status: 'scheduled',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        completed_leads: 0,
        total_leads: 0
      };
      
      const { data: newCampaignData, error: newCampaignError } = await supabase
        .from('campaigns')
        .insert(newCampaign)
        .select();
        
      if (newCampaignError) throw newCampaignError;
      
      toast.success("Campanha duplicada com sucesso");
      
      // Navigate to the new campaign
      if (newCampaignData && newCampaignData[0]) {
        window.location.href = `/campaigns/${newCampaignData[0].id}`;
      }
    } catch (err: any) {
      console.error("Error duplicating campaign:", err);
      toast.error("Erro ao duplicar campanha: " + (err.message || "Erro desconhecido"));
    }
  };
  
  const handleExportLeads = async () => {
    try {
      setIsExporting(true);
      
      // Fetch all leads for this campaign
      const { data: leads, error } = await supabase
        .from('leads')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      
      if (!leads || leads.length === 0) {
        toast.info("Não há leads para exportar nesta campanha.");
        return;
      }
      
      // Convert to CSV
      const csv = Papa.unparse(leads);
      
      // Create a blob and download link
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      // Set up download
      const filename = `campanha_${campaignName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`;
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Leads exportados com sucesso");
    } catch (err: any) {
      console.error("Error exporting leads:", err);
      toast.error("Erro ao exportar leads: " + (err.message || "Erro desconhecido"));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <RunCampaignButton 
        campaignId={campaignId}
        campaignName={campaignName}
        totalLeads={totalLeads}
        pendingLeads={pendingLeads}
        onCampaignRun={onCampaignRun}
        className="mr-2"
      />
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEditClick}>
            <PencilLine className="h-4 w-4 mr-2" />
            Editar Campanha
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleDuplicateCampaign}>
            <Copy className="h-4 w-4 mr-2" />
            Duplicar Campanha
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleExportLeads} disabled={isExporting}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            {isExporting ? 'Exportando...' : 'Exportar Leads'}
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            className="text-red-600 focus:text-red-600" 
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir Campanha
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Campanha</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a campanha "{campaignName}"? Esta ação não pode ser desfeita e todos os leads associados serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCampaign}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? 'Excluindo...' : 'Sim, Excluir Campanha'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
