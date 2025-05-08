
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface UseAIConversationProps {
  defaultSystemPrompt?: string;
  model?: string;
}

export function useAIConversation({
  defaultSystemPrompt = "Você é um assistente virtual útil e educado.",
  model = "gpt-4o-mini"
}: UseAIConversationProps = {}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Adicionar mensagem à conversa
  const addMessage = (role: 'user' | 'assistant' | 'system', content: string) => {
    const newMessage: Message = { role, content };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  };

  // Enviar mensagem para a API e receber resposta
  const sendMessage = async (text: string, customSystemPrompt?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Adicionar a mensagem do usuário ao estado
      addMessage('user', text);
      
      // Preparar mensagens para a API
      const apiMessages = [...messages];
      
      // Adicionar ou substituir o sistema prompt se fornecido
      const systemPrompt = customSystemPrompt || defaultSystemPrompt;
      if (systemPrompt) {
        const systemIndex = apiMessages.findIndex(m => m.role === 'system');
        if (systemIndex >= 0) {
          apiMessages[systemIndex] = { role: 'system', content: systemPrompt };
        } else {
          apiMessages.unshift({ role: 'system', content: systemPrompt });
        }
      }
      
      // Adicionar a nova mensagem do usuário
      apiMessages.push({ role: 'user', content: text });
      
      // Enviar para a API
      const { data, error: apiError } = await supabase.functions.invoke('ai-conversation', {
        body: { 
          messages: apiMessages,
          model
        }
      });

      if (apiError) throw new Error(apiError.message);
      if (!data.success) throw new Error(data.error || 'Erro ao processar solicitação');

      // Adicionar a resposta da API ao estado
      const assistantReply = data.response || "Desculpe, não consegui processar sua solicitação.";
      addMessage('assistant', assistantReply);
      
      return assistantReply;
    } catch (err: any) {
      console.error('Erro na conversação com IA:', err);
      setError(err.message);
      toast.error('Erro na conversação: ' + err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Limpar a conversa
  const clearConversation = () => {
    setMessages([]);
    setError(null);
  };

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    addMessage,
    clearConversation
  };
}
