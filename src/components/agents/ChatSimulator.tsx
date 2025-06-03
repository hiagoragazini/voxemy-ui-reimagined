
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
  instructions?: string;
  responseStyle?: string;
  knowledge?: string;
}

export const ChatSimulator = ({ 
  agentName, 
  defaultGreeting,
  instructions,
  responseStyle,
  knowledge 
}: ChatSimulatorProps) => {
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
    const lowerMessage = userMessage.toLowerCase();
    
    // Respostas baseadas na base de conhecimento
    if (knowledge) {
      const knowledgeLines = knowledge.split('\n').filter(line => line.trim());
      for (const line of knowledgeLines) {
        const lineLower = line.toLowerCase();
        if (lineLower.includes('produto') && (lowerMessage.includes('produto') || lowerMessage.includes('serviço'))) {
          return `Com base no nosso conhecimento: ${line}`;
        }
        if (lineLower.includes('preço') && (lowerMessage.includes('preço') || lowerMessage.includes('valor') || lowerMessage.includes('custo'))) {
          return `Sobre preços: ${line}`;
        }
        if (lineLower.includes('contato') && (lowerMessage.includes('contato') || lowerMessage.includes('telefone') || lowerMessage.includes('email'))) {
          return `Para contato: ${line}`;
        }
      }
    }

    // Respostas baseadas no estilo configurado
    const isInformal = responseStyle?.toLowerCase().includes('informal') || responseStyle?.toLowerCase().includes('amigável');
    const isTechnical = responseStyle?.toLowerCase().includes('técnico');
    const isDetailed = responseStyle?.toLowerCase().includes('detalhado');

    // Respostas contextuais inteligentes
    const responses = {
      'oi': isInformal ? 'Oi! Tudo bem? 😊 Como posso te ajudar hoje?' : 'Olá! Como posso ajudar você hoje?',
      'olá': isInformal ? 'Oi! 👋 Em que posso ser útil?' : 'Olá! Em que posso ser útil?',
      'help': 'Estou aqui para ajudar! Pode me contar o que você precisa?',
      'ajuda': isInformal ? 'Claro! 😄 Estou aqui para ajudar. O que você gostaria de saber?' : 'Claro! Estou aqui para ajudar. O que você gostaria de saber?',
      'preço': isDetailed 
        ? 'Para informações detalhadas sobre preços e planos, posso conectar você com nossa equipe comercial. Eles podem apresentar todas as opções disponíveis e condições especiais.'
        : 'Para informações sobre preços, posso te conectar com nossa equipe comercial.',
      'contato': isDetailed
        ? 'Você pode entrar em contato conosco de várias formas: telefone (11) 99999-9999, email contato@empresa.com, ou através do nosso chat online que funciona 24h.'
        : 'Você pode entrar em contato pelo telefone (11) 99999-9999 ou email contato@empresa.com',
      'horário': isDetailed
        ? 'Nosso atendimento presencial funciona de segunda a sexta, das 8h às 18h. O suporte online funciona 24 horas, e nosso chat está sempre disponível para esclarecer dúvidas.'
        : 'Nosso atendimento funciona de segunda a sexta, das 8h às 18h.',
      'tchau': isInformal ? 'Tchau! 👋 Foi um prazer conversar com você! Tenha um ótimo dia! 😊' : 'Foi um prazer conversar com você! Tenha um ótimo dia!',
      'obrigado': isInformal ? 'Por nada! 😊 Fico feliz em ajudar. Precisa de mais alguma coisa?' : 'Por nada! Fico feliz em ajudar. Precisa de mais alguma coisa?',
      'produto': isDetailed
        ? 'Nossos produtos são desenvolvidos com foco na qualidade e inovação. Posso explicar mais detalhes sobre algum produto específico que te interessa?'
        : 'Posso explicar sobre nossos produtos. Qual te interessa mais?',
      'serviço': 'Oferecemos diversos serviços personalizados. Sobre qual gostaria de saber mais?',
      'suporte': isTechnical
        ? 'Nosso suporte técnico está disponível para resolver questões específicas. Pode descrever o problema que está enfrentando?'
        : 'Estou aqui para dar suporte. Qual é sua dúvida?',
      'problema': 'Sinto muito que esteja enfrentando um problema. Pode me contar mais detalhes para que eu possa ajudar?',
      'dúvida': 'Claro! Estou aqui para esclarecer suas dúvidas. Pode perguntar à vontade.',
      'como': 'Ótima pergunta! Sobre o que especificamente você gostaria de saber?'
    };

    // Procurar por palavras-chave na mensagem
    for (const [keyword, response] of Object.entries(responses)) {
      if (lowerMessage.includes(keyword)) {
        return response;
      }
    }

    // Resposta baseada nas instruções do agente
    if (instructions) {
      const isPolite = instructions.toLowerCase().includes('polido') || instructions.toLowerCase().includes('cordial');
      const isDirect = instructions.toLowerCase().includes('direto');
      
      if (isDirect) {
        return `Entendi sua mensagem sobre "${userMessage}". Como posso ajudar com isso especificamente?`;
      } else if (isPolite) {
        return `Obrigado por sua mensagem. Entendi que você mencionou "${userMessage}". Ficaria feliz em ajudar você com mais informações sobre isso.`;
      }
    }

    // Resposta padrão personalizada
    const defaultResponses = [
      `Entendi sua mensagem: "${userMessage}". Como posso ajudar você com isso?`,
      `Interessante! Sobre "${userMessage}", posso te dar mais informações. O que especificamente você gostaria de saber?`,
      `Obrigado por perguntar sobre "${userMessage}". Estou aqui para esclarecer suas dúvidas.`,
    ];

    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const timestamp = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    // Adicionar mensagem do usuário
    const userMessage: Message = {
      id: Date.now().toString(),
      text: newMessage.trim(),
      isUser: true,
      timestamp,
      status: 'sending'
    };

    const messageText = newMessage.trim();
    setMessages(prev => [...prev, userMessage]);
    setNewMessage("");

    // Simular delay de envio
    setTimeout(() => {
      setMessages(prev => prev.map(msg => 
        msg.id === userMessage.id ? { ...msg, status: 'read' } : msg
      ));
    }, 500);

    // Simular resposta do agente
    setIsTyping(true);
    
    // Delay variável baseado no comprimento da mensagem (mais realístico)
    const baseDelay = 1000;
    const typingDelay = Math.min(messageText.length * 50, 3000);
    
    setTimeout(() => {
      const agentResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: generateAgentResponse(messageText),
        isUser: false,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        status: 'read'
      };

      setMessages(prev => [...prev, agentResponse]);
      setIsTyping(false);
    }, baseDelay + typingDelay);
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
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
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
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Video className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Phone className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Smile className="w-4 h-4" />
            </Button>
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite uma mensagem..."
              className="flex-1 border-none bg-gray-100 focus:bg-white transition-colors"
              disabled={isTyping}
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isTyping}
              size="sm"
              className="bg-blue-500 hover:bg-blue-600 h-8 w-8 p-0"
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
              className="text-xs h-6"
            >
              Limpar Chat
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
