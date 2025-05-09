
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Utility function to verify if an agent exists in the database
 * and display the result. Useful for debugging.
 */
export async function verifyAgentCreation(agentId?: string) {
  try {
    let query = supabase.from('agents').select('*');
    
    if (agentId) {
      query = query.eq('id', agentId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error("Error verifying agent:", error);
      toast.error("Erro ao verificar agente no banco de dados");
      return false;
    }
    
    if (data && data.length > 0) {
      console.log("Agents found in database:", data);
      return true;
    } else {
      console.log("No agents found in database.");
      return false;
    }
  } catch (err) {
    console.error("Error in verifyAgentCreation:", err);
    return false;
  }
}
