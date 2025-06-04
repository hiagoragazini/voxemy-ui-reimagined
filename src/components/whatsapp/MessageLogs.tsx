
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, ArrowUpRight, ArrowDownLeft, Clock, Check, CheckCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

type WhatsAppMessage = Tables<'whatsapp_messages'>;

interface MessageLogsProps {
  agentId: string;
}

export function MessageLogs({ agentId }: MessageLogsProps) {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <Check className="h-3 w-3" />;
      case 'delivered': return <CheckCheck className="h-3 w-3" />;
      case 'read': return <CheckCheck className="h-3 w-3 text-blue-500" />;
      case 'failed': return <Clock className="h-3 w-3 text-red-500" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const formatPhoneNumber = (number: string) => {
    if (number.length === 13 && number.startsWith('55')) {
      const areaCode = number.slice(2, 4);
      const phoneNumber = number.slice(4);
      return `(${areaCode}) ${phoneNumber.slice(0, 5)}-${phoneNumber.slice(5)}`;
    }
    return number;
  };

  useEffect(() => {
    fetchMessages();

    // Set up real-time subscription
    const channel = supabase
      .channel('whatsapp_messages_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_messages',
          filter: `agent_id=eq.${agentId}`
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agentId]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mensagens WhatsApp</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-6">
            <div className="text-muted-foreground">Carregando mensagens...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Mensagens WhatsApp
        </CardTitle>
        <CardDescription>
          Histórico de mensagens recebidas e enviadas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96 w-full">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Nenhuma mensagem ainda
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`border rounded-lg p-3 ${
                    message.direction === 'inbound' 
                      ? 'border-blue-200 bg-blue-50' 
                      : 'border-green-200 bg-green-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {message.direction === 'inbound' ? (
                        <ArrowDownLeft className="h-4 w-4 text-blue-600" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4 text-green-600" />
                      )}
                      <Badge variant={message.direction === 'inbound' ? 'default' : 'secondary'}>
                        {message.direction === 'inbound' ? 'Recebida' : 'Enviada'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {message.direction === 'outbound' && getStatusIcon(message.status)}
                      {new Date(message.created_at).toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <div className="text-sm text-muted-foreground">
                      {message.direction === 'inbound' 
                        ? `De: ${formatPhoneNumber(message.from_number)}`
                        : `Para: ${formatPhoneNumber(message.to_number)}`
                      }
                    </div>
                    <div className="mt-1 text-sm">
                      {message.message_text}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
