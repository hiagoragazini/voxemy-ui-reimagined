
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { Send, Phone, Video, MoreVertical, Smile } from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
}

interface ChatSimulatorProps {
  agentName: string;
  defaultGreeting?: string;
}

export const ChatSimulator = ({ agentName, defaultGreeting }: ChatSimulatorProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    // Enviar mensagem de boas-vindas quando o componente carrega
    if (defaultGreeting) {
      const welcomeMessage: Message = {
        id: '1',
        text: defaultGreeting,
        isUser: false,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        status: 'read'
      };
      setMessages([welcomeMessage]);
    }
  }, [defaultGreeting]);

  const generateAgentResponse = (userMessage: string): string => {
    // Simulação simples de resposta do agente baseada na mensagem do usuário
    const responses = {
      'oi': 'Olá! Como posso ajudar você hoje?',
      'olá': 'Oi! Em que posso ser útil?',
      'help': 'Estou aqui para ajudar! Pode me contar o que você precisa?',
      'ajuda': 'Claro! Estou aqui para ajudar. O que você gostaria de saber?',
      'preço': 'Para informações sobre preços, posso te conectar com nossa equipe comercial.',
      'contato': 'Você pode entrar em contato conosco pelo telefone (11) 99999-9999 ou email contato@empresa.com',
      'horário': 'Nosso atendimento funciona de segunda a sexta, das 8h às 18h.',
      'tchau': 'Foi um prazer conversar com você! Tenha um ótimo dia!',
      'obrigado': 'Por nada! Fico feliz em ajudar. Precisa de mais alguma coisa?'
    };

    const lowerMessage = userMessage.toLowerCase();
    
    // Procurar por palavras-chave na mensagem
    for (const [keyword, response] of Object.entries(responses)) {
      if (lowerMessage.includes(keyword)) {
        return response;
      }
    }

    // Resposta padrão
    return `Entendi sua mensagem: "${userMessage}". Como posso ajudar você com isso?`;
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const timestamp = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    // Adicionar mensagem do usuário
    const userMessage: Message = {
      id: Date.now().toString(),
      text: newMessage,
      isUser: true,
      timestamp,
      status: 'sending'
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage("");

    // Simular delay de envio
    setTimeout(() => {
      setMessages(prev => prev.map(msg => 
        msg.id === userMessage.id ? { ...msg, status: 'read' } : msg
      ));
    }, 1000);

    // Simular resposta do agente
    setIsTyping(true);
    
    setTimeout(() => {
      const agentResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: generateAgentResponse(newMessage),
        isUser: false,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        status: 'read'
      };

      setMessages(prev => [...prev, agentResponse]);
      setIsTyping(false);
    }, 2000 + Math.random() * 2000); // Delay variável para parecer mais natural
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages(defaultGreeting ? [{
      id: '1',
      text: defaultGreeting,
      isUser: false,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      status: 'read'
    }] : []);
    toast.success("Chat limpo!");
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {agentName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <CardTitle className="text-sm">{agentName}</CardTitle>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                <CardDescription className="text-xs">
                  {isOnline ? 'Online' : 'Offline'}
                </CardDescription>
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="ghost" size="sm">
              <Video className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Phone className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Área de mensagens */}
        <div className="h-80 overflow-y-auto px-4 py-2 bg-gray-50">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 text-sm">Inicie uma conversa...</p>
            </div>
          )}
          
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message.text}
              isUser={message.isUser}
              timestamp={message.timestamp}
              status={message.status}
            />
          ))}
          
          {isTyping && (
            <div className="flex justify-start mb-3">
              <TypingIndicator />
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Área de input */}
        <div className="border-t bg-white p-3">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Smile className="w-4 h-4" />
            </Button>
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite uma mensagem..."
              className="flex-1 border-none bg-gray-100 focus:bg-white transition-colors"
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isTyping}
              size="sm"
              className="bg-green-500 hover:bg-green-600"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex justify-between items-center mt-2">
            <Badge variant="outline" className="text-xs">
              Simulação de Chat
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              className="text-xs"
            >
              Limpar Chat
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
