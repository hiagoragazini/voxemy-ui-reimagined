
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
      
      // Check permissions and RLS
      console.log("Verificando permissões e políticas de segurança...");
      const authUser = supabase.auth.getUser();
      console.log("Usuário autenticado:", await authUser);
      
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
    
    // Check if user is authenticated
    const { data: userData } = await supabase.auth.getUser();
    if (userData && userData.user) {
      console.log("Usuário autenticado:", userData.user.email);
    } else {
      console.warn("Usuário não autenticado. Isso pode afetar a visualização de dados com RLS.");
      toast.warning("Você não está autenticado. Isso pode afetar a visualização de dados.");
    }
    
    const { data, error } = await supabase
      .from('agents')
      .select('*');
      
    if (error) {
      console.error("Erro ao atualizar agentes:", error);
      toast.error("Erro ao buscar agentes: " + error.message);
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
      
      // Verificar se a tabela 'agents' existe
      try {
        console.log("Verificando a existência da tabela 'agents'...");
        
        // Use the table_exists RPC function instead of direct schema query
        const { data: tableExists, error: funcError } = await supabase
          .rpc('table_exists', { table_name: 'agents' });
          
        if (funcError) {
          console.error("Erro ao verificar existência da tabela:", funcError);
          toast.error("Não foi possível verificar se a tabela 'agents' existe");
        } else {
          console.log(`Tabela 'agents' ${tableExists ? 'existe' : 'não existe'} no banco de dados.`);
          
          if (!tableExists) {
            toast.error("A tabela 'agents' não existe no banco de dados!");
          } else {
            toast.info("A tabela 'agents' existe, mas não há registros ou você não tem permissão para vê-los");
          }
        }
      } catch (tableErr) {
        console.error("Erro ao verificar tabela:", tableErr);
      }
      
      return [];
    }
  } catch (err) {
    console.error("Erro em forceRefreshAgents:", err);
    toast.error("Falha ao atualizar agentes: " + (err instanceof Error ? err.message : String(err)));
    return [];
  }
}

/**
 * Diagnose database connection and permission issues
 * This function runs a comprehensive test to detect issues
 * with the agents functionality
 * 
 * @returns {Promise<boolean>} True if the diagnosis was successful
 */
export async function diagnoseAgentIssues() {
  try {
    toast.info("Iniciando diagnóstico de problemas com agentes...");
    
    // 1. Verificar autenticação
    const { data: user, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error("Erro de autenticação:", authError);
      toast.error("Problema de autenticação detectado");
      return false;
    }
    
    if (!user || !user.user) {
      console.warn("Usuário não autenticado");
      toast.warning("Você não está autenticado. Faça login para visualizar seus agentes.");
      return false;
    }
    
    console.log("Usuário autenticado:", user.user.email);
    toast.success("Autenticação OK: " + user.user.email);
    
    // 2. Tentar inserir um agente de teste
    const testAgentName = `Agente de Teste ${new Date().toISOString()}`;
    toast.info("Tentando criar um agente de teste para diagnóstico...");
    
    const { data: insertedAgent, error: insertError } = await supabase
      .from('agents')
      .insert({
        name: testAgentName,
        status: 'testing',
        description: 'Agente criado para diagnóstico',
        category: 'Teste',
        voice_id: 'EXAVITQu4vr4xnSDxMaL' // ID da voz Sarah
      })
      .select();
    
    if (insertError) {
      console.error("Erro ao inserir agente de teste:", insertError);
      toast.error("Não foi possível criar agente de teste: " + insertError.message);
      
      if (insertError.code === '42P01') {
        toast.error("A tabela 'agents' não existe no banco de dados!");
      } else if (insertError.code === '23505') {
        toast.warning("Já existe um agente com esse nome");
      } else if (insertError.code === '42501') {
        toast.error("Você não tem permissão para inserir dados");
      }
      
      return false;
    }
    
    console.log("Agente de teste criado com sucesso:", insertedAgent);
    toast.success("Agente de teste criado com sucesso!");
    
    // 3. Buscar o agente de teste que acabamos de criar
    const { data: fetchedAgent, error: fetchError } = await supabase
      .from('agents')
      .select('*')
      .eq('name', testAgentName)
      .maybeSingle();
    
    if (fetchError) {
      console.error("Erro ao buscar agente de teste:", fetchError);
      toast.error("Erro ao buscar agente de teste após criação");
      return false;
    }
    
    if (!fetchedAgent) {
      console.error("Agente de teste não encontrado após criação");
      toast.error("O agente foi criado mas não pode ser recuperado - possível problema de permissões");
      return false;
    }
    
    console.log("Agente de teste recuperado com sucesso:", fetchedAgent);
    toast.success("Sistema funcionando corretamente! O agente pode ser criado e recuperado.");
    
    // Notificar o usuário para recarregar a página
    toast.info("Por favor, recarregue a página para ver os agentes", {
      duration: 10000, // Mostrar por 10 segundos
      action: {
        label: "Recarregar",
        onClick: () => window.location.reload()
      }
    });
    
    // Limpeza - remover o agente de teste
    const { error: deleteError } = await supabase
      .from('agents')
      .delete()
      .eq('name', testAgentName);
    
    if (deleteError) {
      console.warn("Não foi possível limpar o agente de teste:", deleteError);
    } else {
      console.log("Agente de teste removido com sucesso");
    }
    
    return true;
  } catch (err) {
    console.error("Erro no diagnóstico:", err);
    toast.error("Falha no processo de diagnóstico");
    return false;
  }
}
