
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface EvolutionWebhookPayload {
  event: string;
  instance: string;
  data: {
    key?: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
    message?: {
      conversation?: string;
      extendedTextMessage?: {
        text: string;
      };
    };
    messageTimestamp?: number;
    pushName?: string;
    qrcode?: string;
    state?: string;
  };
}

interface AgentConfig {
  id: string;
  name: string;
  instructions?: string;
  ai_model?: string;
  max_response_length?: number;
  default_greeting?: string;
}

class WebhookProcessor {
  private supabase;
  private rateLimitMap = new Map<string, { count: number; lastReset: number }>();
  private agentCache = new Map<string, { agent: AgentConfig | null; expiry: number }>();

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  async processWebhook(request: NextRequest): Promise<NextResponse> {
    try {
      // Validate webhook
      if (!(await this.validateWebhook(request))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const body: EvolutionWebhookPayload = await request.json();
      console.log('WhatsApp webhook received:', JSON.stringify(body, null, 2));

      // Rate limiting
      if (!this.checkRateLimit(body.instance)) {
        return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
      }

      // Get agent by instance
      const agentConfig = await this.getAgentByInstance(body.instance);
      if (!agentConfig) {
        console.error('Agent not found for instance:', body.instance);
        return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
      }

      // Process different events
      switch (body.event) {
        case 'qrcode.updated':
          return await this.handleQRCodeUpdate(body, agentConfig.id);
        
        case 'connection.update':
          return await this.handleConnectionUpdate(body, agentConfig.id);
        
        case 'messages.upsert':
          return await this.handleNewMessage(body, agentConfig);
        
        case 'messages.update':
          return await this.handleMessageUpdate(body, agentConfig.id);
        
        default:
          console.log('Unhandled webhook event:', body.event);
          return NextResponse.json({ status: 'ignored' });
      }

    } catch (error) {
      console.error('Webhook processing error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }

  private async validateWebhook(request: NextRequest): Promise<boolean> {
    const apiKey = request.headers.get('authorization') || request.headers.get('apikey');
    const expectedKey = process.env.EVOLUTION_API_KEY;
    
    if (!expectedKey) {
      console.warn('EVOLUTION_API_KEY not configured');
      return true; // Allow in development
    }
    
    return apiKey === expectedKey || apiKey === `Bearer ${expectedKey}`;
  }

  private checkRateLimit(instanceId: string): boolean {
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    const maxRequests = 100;

    const current = this.rateLimitMap.get(instanceId) || { count: 0, lastReset: now };
    
    if (now - current.lastReset > windowMs) {
      current.count = 1;
      current.lastReset = now;
    } else {
      current.count++;
    }

    this.rateLimitMap.set(instanceId, current);
    return current.count <= maxRequests;
  }

  private async getAgentByInstance(instanceId: string): Promise<AgentConfig | null> {
    // Check cache first
    const cached = this.agentCache.get(instanceId);
    if (cached && Date.now() < cached.expiry) {
      return cached.agent;
    }

    try {
      // Get agent_id from whatsapp_connections
      const { data: connection } = await this.supabase
        .from('whatsapp_connections')
        .select('agent_id')
        .eq('instance_id', instanceId)
        .single();

      if (!connection) {
        this.agentCache.set(instanceId, { agent: null, expiry: Date.now() + 300000 }); // 5 minutes
        return null;
      }

      // Get agent config
      const { data: agent } = await this.supabase
        .from('agents')
        .select('id, name, instructions, ai_model, max_response_length, default_greeting')
        .eq('id', connection.agent_id)
        .eq('status', 'active')
        .single();

      const agentConfig = agent as AgentConfig | null;
      this.agentCache.set(instanceId, { agent: agentConfig, expiry: Date.now() + 300000 }); // 5 minutes
      
      return agentConfig;
    } catch (error) {
      console.error('Error getting agent by instance:', error);
      return null;
    }
  }

  private async handleQRCodeUpdate(body: EvolutionWebhookPayload, agentId: string): Promise<NextResponse> {
    try {
      const qrCode = body.data.qrcode;
      
      if (qrCode) {
        await this.supabase
          .from('whatsapp_connections')
          .update({ 
            qr_code: qrCode,
            status: 'connecting',
            updated_at: new Date().toISOString()
          })
          .eq('instance_id', body.instance);
        
        console.log('QR code updated in database');
      }
      
      return NextResponse.json({ status: 'qr_updated' });
    } catch (error) {
      console.error('Error handling QR code update:', error);
      return NextResponse.json({ error: 'Failed to update QR code' }, { status: 500 });
    }
  }

  private async handleConnectionUpdate(body: EvolutionWebhookPayload, agentId: string): Promise<NextResponse> {
    try {
      const state = body.data.state;
      const status = state === 'open' ? 'connected' : 'disconnected';
      
      await this.supabase
        .from('whatsapp_connections')
        .update({ 
          status: status,
          last_connected_at: status === 'connected' ? new Date().toISOString() : null,
          qr_code: status === 'connected' ? null : undefined,
          updated_at: new Date().toISOString()
        })
        .eq('instance_id', body.instance);
      
      console.log('Connection status updated to:', status);
      
      return NextResponse.json({ status: 'connection_updated' });
    } catch (error) {
      console.error('Error handling connection update:', error);
      return NextResponse.json({ error: 'Failed to update connection' }, { status: 500 });
    }
  }

  private async handleNewMessage(body: EvolutionWebhookPayload, agentConfig: AgentConfig): Promise<NextResponse> {
    try {
      const messageData = body.data;
      
      if (!messageData.key || messageData.key.fromMe) {
        console.log('Ignoring message from bot itself');
        return NextResponse.json({ status: 'ignored' });
      }

      const messageText = messageData.message?.conversation || 
                         messageData.message?.extendedTextMessage?.text || '';
      
      if (!messageText.trim()) {
        console.log('No text content in message');
        return NextResponse.json({ status: 'no_text' });
      }

      const fromNumber = messageData.key.remoteJid.replace('@s.whatsapp.net', '');
      const senderName = messageData.pushName || fromNumber;
      
      console.log('Processing message from:', fromNumber, 'Text:', messageText);

      // Get WhatsApp connection info
      const { data: connection } = await this.supabase
        .from('whatsapp_connections')
        .select('phone_number')
        .eq('agent_id', agentConfig.id)
        .single();

      // Save incoming message
      await this.saveMessage(agentConfig.id, fromNumber, messageText, true);

      // Process AI response
      const aiResponse = await this.processAIResponse(agentConfig, messageText, senderName);

      // Send response
      const success = await this.sendWhatsAppMessage(agentConfig.id, fromNumber, aiResponse);

      if (success) {
        // Save outgoing message
        await this.saveMessage(agentConfig.id, fromNumber, aiResponse, false);
      }

      return NextResponse.json({ 
        status: 'processed',
        response: aiResponse 
      });

    } catch (error) {
      console.error('Error handling new message:', error);
      return NextResponse.json({ error: 'Failed to process message' }, { status: 500 });
    }
  }

  private async handleMessageUpdate(body: EvolutionWebhookPayload, agentId: string): Promise<NextResponse> {
    try {
      // Update message status in database if needed
      console.log('Message update received:', body.data);
      return NextResponse.json({ status: 'message_updated' });
    } catch (error) {
      console.error('Error handling message update:', error);
      return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
    }
  }

  private async processAIResponse(agentConfig: AgentConfig, userMessage: string, senderName: string): Promise<string> {
    try {
      // Get conversation context (last 10 messages)
      const { data: recentMessages } = await this.supabase
        .from('whatsapp_messages')
        .select('message_text, is_from_user')
        .eq('agent_id', agentConfig.id)
        .order('created_at', { ascending: false })
        .limit(10);

      // Build context
      const context = recentMessages?.reverse().map(msg => 
        msg.is_from_user ? `${senderName}: ${msg.message_text}` : `${agentConfig.name}: ${msg.message_text}`
      ).join('\n') || '';

      // Build system prompt
      const systemPrompt = `Você é ${agentConfig.name}, um assistente de WhatsApp.

${agentConfig.instructions ? `Instruções: ${agentConfig.instructions}` : ''}

IMPORTANTE:
- Responda em português brasileiro
- Seja natural e conversacional
- Mantenha as respostas concisas (máximo ${agentConfig.max_response_length || 200} caracteres)
- Use o nome do cliente quando apropriado: ${senderName}
- Esta é uma conversa por WhatsApp, seja direto e amigável

Contexto da conversa:
${context}`;

      // Call AI
      const { data: aiResponse, error } = await this.supabase.functions.invoke('ai-conversation', {
        body: {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          model: agentConfig.ai_model || 'gpt-4o-mini'
        }
      });

      if (error) {
        console.error('AI processing error:', error);
        return agentConfig.default_greeting || 'Olá! Como posso ajudá-lo hoje?';
      }

      let responseText = aiResponse?.response || agentConfig.default_greeting || 'Olá! Como posso ajudá-lo hoje?';
      
      // Limit response length
      const maxLength = agentConfig.max_response_length || 200;
      if (responseText.length > maxLength) {
        responseText = responseText.substring(0, maxLength - 3) + '...';
      }

      return responseText;
    } catch (error) {
      console.error('Error processing AI response:', error);
      return agentConfig.default_greeting || 'Olá! Como posso ajudá-lo hoje?';
    }
  }

  private async sendWhatsAppMessage(agentId: string, to: string, message: string): Promise<boolean> {
    try {
      const { error } = await this.supabase.functions.invoke('whatsapp-sender', {
        body: {
          agentId: agentId,
          to: to,
          message: message
        }
      });

      return !error;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return false;
    }
  }

  private async saveMessage(agentId: string, userPhone: string, messageText: string, isFromUser: boolean): Promise<void> {
    try {
      await this.supabase
        .from('whatsapp_messages')
        .insert({
          agent_id: agentId,
          from_number: isFromUser ? userPhone : '',
          to_number: isFromUser ? '' : userPhone,
          message_text: messageText,
          message_type: 'text',
          direction: isFromUser ? 'inbound' : 'outbound',
          status: 'received'
        });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  }
}

const webhookProcessor = new WebhookProcessor();

export async function POST(request: NextRequest) {
  return webhookProcessor.processWebhook(request);
}

export async function GET() {
  return NextResponse.json({ status: 'WhatsApp webhook is healthy' });
}
