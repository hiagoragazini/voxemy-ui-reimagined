
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export function useAgentOperations() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const navigate = useNavigate();

  const deleteAgent = async (agentId: string, agentName: string) => {
    setIsDeleting(true);
    
    try {
      console.log(`Deleting agent ${agentId}...`);
      
      const { error } = await supabase
        .from('agents')
        .delete()
        .eq('id', agentId);
      
      if (error) {
        throw error;
      }
      
      toast.success(`Agente "${agentName}" excluído com sucesso!`);
      return true;
    } catch (error: any) {
      console.error('Error deleting agent:', error);
      toast.error(`Erro ao excluir agente: ${error.message}`);
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  const duplicateAgent = async (agentId: string) => {
    setIsDuplicating(true);
    
    try {
      console.log(`Duplicating agent ${agentId}...`);
      
      // Fetch the original agent
      const { data: originalAgent, error: fetchError } = await supabase
        .from('agents')
        .select('*')
        .eq('id', agentId)
        .single();
      
      if (fetchError) {
        throw fetchError;
      }
      
      if (!originalAgent) {
        throw new Error('Agente não encontrado');
      }
      
      // Create duplicate with modified name
      const duplicateData = {
        ...originalAgent,
        id: undefined, // Let Supabase generate new ID
        name: `${originalAgent.name} (Cópia)`,
        created_at: undefined,
        updated_at: undefined,
        status: 'paused' // Start duplicates as paused
      };
      
      const { data: newAgent, error: createError } = await supabase
        .from('agents')
        .insert(duplicateData)
        .select()
        .single();
      
      if (createError) {
        throw createError;
      }
      
      toast.success(`Agente duplicado como "${duplicateData.name}"!`);
      
      // Navigate to edit the new agent
      navigate(`/agents/${newAgent.id}/edit`);
      
      return newAgent;
    } catch (error: any) {
      console.error('Error duplicating agent:', error);
      toast.error(`Erro ao duplicar agente: ${error.message}`);
      return null;
    } finally {
      setIsDuplicating(false);
    }
  };

  const toggleAgentStatus = async (agentId: string, currentStatus: string, agentName: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      
      const { error } = await supabase
        .from('agents')
        .update({ status: newStatus })
        .eq('id', agentId);
      
      if (error) {
        throw error;
      }
      
      const statusText = newStatus === 'active' ? 'ativado' : 'pausado';
      toast.success(`Agente "${agentName}" ${statusText} com sucesso!`);
      
      return newStatus;
    } catch (error: any) {
      console.error('Error toggling agent status:', error);
      toast.error(`Erro ao alterar status: ${error.message}`);
      return currentStatus;
    }
  };

  return {
    deleteAgent,
    duplicateAgent,
    toggleAgentStatus,
    isDeleting,
    isDuplicating
  };
}
