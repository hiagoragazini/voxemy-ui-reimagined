
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
  private pollingIntervals = new Map<string, NodeJS.Timeout>();
  private healthCheckInterval?: NodeJS.Timeout;
  private evolutionApiUrl?: string;
  private evolutionApiKey?: string;
  private appUrl?: string;

  constructor() {
    this.initializeConfig();
    this.startHealthCheck();
  }

  private initializeConfig() {
    this.evolutionApiUrl = process.env.NEXT_PUBLIC_EVOLUTION_API_URL;
    this.evolutionApiKey = process.env.EVOLUTION_API_KEY;
    this.appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    if (!this.evolutionApiUrl || !this.evolutionApiKey) {
      console.warn('Evolution API not configured. WhatsApp features will run in development mode.');
    }
  }

  private isConfigured(): boolean {
    return !!(this.evolutionApiUrl && this.evolutionApiKey);
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

  private getWebhookUrl(): string {
    return `${this.appUrl}/api/whatsapp/webhook`;
  }

  private clearPolling(agentId: string) {
    const interval = this.pollingIntervals.get(agentId);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(agentId);
    }
  }

  private async startQRPolling(agentId: string, instanceId: string): Promise<void> {
    if (!this.isConfigured()) return;

    let attempts = 0;
    const maxAttempts = 30; // 5 minutes with 10-second intervals

    const pollInterval = setInterval(async () => {
      attempts++;
      
      try {
        const response = await fetch(`${this.evolutionApiUrl}/instance/connect/${instanceId}`, {
          headers: { 'apikey': this.evolutionApiKey! }
        });

        if (response.ok) {
          const data = await response.json();
          const qrCode = data.base64 || data.qrcode?.base64;
          
          if (qrCode) {
            const connection = this.connections.get(agentId);
            if (connection) {
              connection.qrCode = qrCode;
              connection.lastActivity = new Date().toISOString();
              await this.persistConnection(connection);
            }
          }
        }

        // Check connection status
        const statusResponse = await fetch(`${this.evolutionApiUrl}/instance/connectionState/${instanceId}`, {
          headers: { 'apikey': this.evolutionApiKey! }
        });

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          if (statusData.instance?.state === 'open') {
            // Connected successfully
            const connection = this.connections.get(agentId);
            if (connection) {
              connection.status = 'connected';
              connection.phoneNumber = statusData.instance?.owner;
              connection.qrCode = undefined;
              connection.lastActivity = new Date().toISOString();
              await this.persistConnection(connection);
            }
            this.clearPolling(agentId);
            return;
          }
        }

        if (attempts >= maxAttempts) {
          // Timeout
          const connection = this.connections.get(agentId);
          if (connection) {
            connection.status = 'error';
            connection.errorMessage = 'QR code polling timeout';
            await this.persistConnection(connection);
          }
          this.clearPolling(agentId);
        }
      } catch (error) {
        console.error('QR polling error:', error);
        if (attempts >= maxAttempts) {
          this.clearPolling(agentId);
        }
      }
    }, 10000); // 10 seconds

    this.pollingIntervals.set(agentId, pollInterval);
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

      const instanceId = `agent_${agentId}`;
      const connection: WhatsAppConnection = {
        id: `conn_${agentId}`,
        agentId,
        instanceId,
        status: 'connecting',
        lastActivity: new Date().toISOString()
      };

      this.connections.set(agentId, connection);

      if (!this.isConfigured()) {
        // Development mode - simulate connection
        setTimeout(() => {
          connection.status = 'connected';
          connection.phoneNumber = '+5511999999999';
          this.persistConnection(connection);
        }, 2000);
        return connection;
      }

      // Delete existing instance
      try {
        await fetch(`${this.evolutionApiUrl}/instance/delete/${instanceId}`, {
          method: 'DELETE',
          headers: { 'apikey': this.evolutionApiKey! }
        });
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.log('No existing instance to delete');
      }

      // Create new instance
      const createResponse = await fetch(`${this.evolutionApiUrl}/instance/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.evolutionApiKey!
        },
        body: JSON.stringify({
          instanceName: instanceId,
          token: this.evolutionApiKey,
          qrcode: true,
          webhook: this.getWebhookUrl(),
          webhookByEvents: false,
          webhookBase64: false,
          events: ['APPLICATION_STARTUP', 'QRCODE_UPDATED', 'CONNECTION_UPDATE', 'MESSAGES_UPSERT']
        })
      });

      if (!createResponse.ok) {
        throw new Error(`Failed to create instance: ${createResponse.status}`);
      }

      await new Promise(resolve => setTimeout(resolve, 3000));
      await this.startQRPolling(agentId, instanceId);
      await this.persistConnection(connection);

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
      this.clearPolling(agentId);
      
      const connection = this.connections.get(agentId);
      if (!connection) return false;

      if (this.isConfigured()) {
        try {
          await fetch(`${this.evolutionApiUrl}/instance/delete/${connection.instanceId}`, {
            method: 'DELETE',
            headers: { 'apikey': this.evolutionApiKey! }
          });
        } catch (error) {
          console.error('Error deleting instance:', error);
        }
      }

      connection.status = 'disconnected';
      connection.phoneNumber = undefined;
      connection.qrCode = undefined;
      connection.lastActivity = new Date().toISOString();
      
      await this.persistConnection(connection);
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

      // Load from database
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase
        .from('whatsapp_connections')
        .select('*')
        .eq('agent_id', agentId)
        .single();

      if (error || !data) return null;

      const connection: WhatsAppConnection = {
        id: data.id,
        agentId: data.agent_id,
        instanceId: data.instance_id || `agent_${agentId}`,
        status: data.status as any,
        qrCode: data.qr_code,
        phoneNumber: data.phone_number,
        lastActivity: data.updated_at
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
      const connection = await this.getConnection(agentId);
      if (!connection || connection.status !== 'connected') {
        throw new Error('WhatsApp not connected for this agent');
      }

      if (!this.isConfigured()) {
        console.log(`[DEV MODE] Sending message to ${to}: ${message}`);
        return true;
      }

      const response = await fetch(`${this.evolutionApiUrl}/message/sendText/${connection.instanceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.evolutionApiKey!
        },
        body: JSON.stringify({
          number: `${to}@s.whatsapp.net`,
          text: message
        })
      });

      return response.ok;
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

  private startHealthCheck() {
    this.healthCheckInterval = setInterval(async () => {
      if (!this.isConfigured()) return;

      for (const [agentId, connection] of this.connections.entries()) {
        if (connection.status === 'connected') {
          try {
            const response = await fetch(`${this.evolutionApiUrl}/instance/connectionState/${connection.instanceId}`, {
              headers: { 'apikey': this.evolutionApiKey! }
            });

            if (response.ok) {
              const data = await response.json();
              const isConnected = data.instance?.state === 'open';
              
              if (!isConnected && connection.status === 'connected') {
                connection.status = 'disconnected';
                connection.phoneNumber = undefined;
                await this.persistConnection(connection);
              }
            }
          } catch (error) {
            console.error(`Health check failed for ${agentId}:`, error);
          }
        }
      }
    }, 60000); // 1 minute
  }

  cleanup(): void {
    // Clear all intervals
    for (const interval of this.pollingIntervals.values()) {
      clearInterval(interval);
    }
    this.pollingIntervals.clear();

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Clear connections
    this.connections.clear();
  }
}

// Singleton instance
export const whatsappManager = new WhatsAppManager();
