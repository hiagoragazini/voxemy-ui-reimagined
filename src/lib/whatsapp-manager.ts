
interface WhatsAppConnection {
  id: string;
  agentId: string;
  instanceId: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  qrCode?: string;
  phoneNumber?: string;
  lastActivity?: string;
  errorMessage?: string;
}

interface AgentConfig {
  id: string;
  name: string;
  status: string;
  instructions?: string;
  ai_model?: string;
  max_response_length?: number;
}

class WhatsAppManager {
  private connections = new Map<string, WhatsAppConnection>();
  private supabaseUrl: string;

  constructor() {
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nklbbeavnbwvvatqimxw.supabase.co';
  }

  private async callEdgeFunction(functionName: string, payload: any): Promise<any> {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.error(`Error calling ${functionName}:`, error);
      throw error;
    }
  }

  private async validateAgent(agentId: string): Promise<AgentConfig | null> {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: agent, error } = await supabase
        .from('agents')
        .select('id, name, status, instructions, ai_model, max_response_length')
        .eq('id', agentId)
        .single();

      if (error || !agent || agent.status !== 'active') {
        console.error('Invalid agent:', error?.message || 'Agent not active');
        return null;
      }

      return agent as AgentConfig;
    } catch (error) {
      console.error('Error validating agent:', error);
      return null;
    }
  }

  private async persistConnection(connection: WhatsAppConnection): Promise<void> {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      await supabase
        .from('whatsapp_connections')
        .upsert({
          agent_id: connection.agentId,
          instance_id: connection.instanceId,
          status: connection.status,
          qr_code: connection.qrCode,
          phone_number: connection.phoneNumber,
          last_connected_at: connection.status === 'connected' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        }, { onConflict: 'agent_id' });
    } catch (error) {
      console.error('Error persisting connection:', error);
    }
  }

  async createConnection(agentId: string): Promise<WhatsAppConnection | null> {
    try {
      // Validate agent
      const agent = await this.validateAgent(agentId);
      if (!agent) {
        throw new Error('Invalid or inactive agent');
      }

      // Check if already connected
      const existing = this.connections.get(agentId);
      if (existing && existing.status === 'connected') {
        return existing;
      }

      console.log('Creating WhatsApp connection for agent:', agentId);

      const response = await this.callEdgeFunction('whatsapp-manager', {
        action: 'connect',
        agentId: agentId
      });

      if (response.error) {
        throw new Error(response.error);
      }

      const connection: WhatsAppConnection = {
        id: `conn_${agentId}`,
        agentId,
        instanceId: response.instanceId,
        status: response.status as any,
        qrCode: response.qrCode,
        lastActivity: new Date().toISOString()
      };

      this.connections.set(agentId, connection);
      return connection;

    } catch (error) {
      console.error('Error creating connection:', error);
      const errorConnection: WhatsAppConnection = {
        id: `conn_${agentId}`,
        agentId,
        instanceId: `agent_${agentId}`,
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        lastActivity: new Date().toISOString()
      };
      this.connections.set(agentId, errorConnection);
      await this.persistConnection(errorConnection);
      return errorConnection;
    }
  }

  async disconnectAgent(agentId: string): Promise<boolean> {
    try {
      console.log('Disconnecting WhatsApp for agent:', agentId);

      const response = await this.callEdgeFunction('whatsapp-manager', {
        action: 'disconnect',
        agentId: agentId
      });

      if (response.error) {
        throw new Error(response.error);
      }

      this.connections.delete(agentId);
      return true;

    } catch (error) {
      console.error('Error disconnecting agent:', error);
      return false;
    }
  }

  async getConnection(agentId: string): Promise<WhatsAppConnection | null> {
    try {
      // Try memory first
      const memoryConnection = this.connections.get(agentId);
      if (memoryConnection) return memoryConnection;

      // Load from database via API
      const response = await this.callEdgeFunction('whatsapp-manager', {
        action: 'status',
        agentId: agentId
      });

      if (response.error) {
        return null;
      }

      const connection: WhatsAppConnection = {
        id: `conn_${agentId}`,
        agentId: agentId,
        instanceId: response.instanceId || `agent_${agentId}`,
        status: response.status as any,
        qrCode: response.qrCode,
        phoneNumber: response.phoneNumber,
        lastActivity: new Date().toISOString()
      };

      this.connections.set(agentId, connection);
      return connection;
    } catch (error) {
      console.error('Error getting connection:', error);
      return null;
    }
  }

  async sendMessage(agentId: string, to: string, message: string): Promise<boolean> {
    try {
      const response = await this.callEdgeFunction('whatsapp-sender', {
        agentId: agentId,
        to: to,
        message: message
      });

      return response.success || false;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }

  async healthCheck(): Promise<{ [agentId: string]: boolean }> {
    const results: { [agentId: string]: boolean } = {};
    
    for (const [agentId, connection] of this.connections.entries()) {
      results[agentId] = connection.status === 'connected';
    }
    
    return results;
  }

  cleanup(): void {
    // Clear connections
    this.connections.clear();
  }
}

// Singleton instance
export const whatsappManager = new WhatsAppManager();
