
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Utility function to verify if an agent exists in the database
 * and display the result. Useful for debugging.
 */
export async function verifyAgentCreation(agentId?: string) {
  try {
    console.log("Verificando agentes no banco de dados...");
    
    let query = supabase.from('agents').select('*');
    
    if (agentId) {
      console.log(`Procurando especificamente o agente com ID: ${agentId}`);
      query = query.eq('id', agentId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error("Erro ao verificar agente:", error);
      toast.error("Erro ao verificar agente no banco de dados");
      return false;
    }
    
    if (data && data.length > 0) {
      console.log("Agentes encontrados no banco de dados:", data);
      toast.success(`${data.length} agente(s) encontrado(s) no banco`);
      
      // Display each agent found for debugging
      data.forEach(agent => {
        console.log(`Agente: ${agent.name}, ID: ${agent.id}, Status: ${agent.status}`);
        toast.info(`Agente encontrado: ${agent.name}`);
      });
      
      return true;
    } else {
      console.log("Nenhum agente encontrado no banco de dados.");
      toast.warning("Nenhum agente encontrado no banco de dados");
      return false;
    }
  } catch (err) {
    console.error("Erro em verifyAgentCreation:", err);
    return false;
  }
}

/**
 * Manually force a request to fetch agents from database
 * This can be used as a last resort debugging tool
 */
export async function forceRefreshAgents() {
  try {
    console.log("Executando atualização forçada dos agentes...");
    toast.info("Verificando agentes no banco de dados...");
    
    const { data, error } = await supabase
      .from('agents')
      .select('*');
      
    if (error) {
      console.error("Erro ao atualizar agentes:", error);
      toast.error("Erro ao buscar agentes");
      return [];
    }
    
    if (data && data.length > 0) {
      console.log("Agentes recuperados após atualização forçada:", data);
      toast.success(`Atualizado: ${data.length} agente(s) disponível(is)`);
      
      // Log each agent individually
      data.forEach((agent, index) => {
        console.log(`Agente ${index + 1}: ID=${agent.id}, Nome=${agent.name}, Status=${agent.status}`);
      });
      
      return data;
    } else {
      console.log("Nenhum agente encontrado após atualização forçada.");
      toast.warning("Nenhum agente encontrado no banco de dados");
      
      // Check if the agents table exists
      const { data: tables, error: tableError } = await supabase
        .from('pg_tables')
        .select('tablename')
        .eq('schemaname', 'public');
        
      if (tableError) {
        console.error("Erro ao verificar tabelas:", tableError);
      } else if (tables) {
        const hasAgentsTable = tables.some(t => t.tablename === 'agents');
        console.log(`Tabela 'agents' ${hasAgentsTable ? 'existe' : 'não existe'} no banco de dados.`);
        
        if (!hasAgentsTable) {
          toast.error("A tabela 'agents' não existe no banco de dados!");
        }
      }
      
      return [];
    }
  } catch (err) {
    console.error("Erro em forceRefreshAgents:", err);
    toast.error("Falha ao atualizar agentes");
    return [];
  }
}
