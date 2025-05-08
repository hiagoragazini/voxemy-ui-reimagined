
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/dashboard/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useVoiceCall } from "@/hooks/use-voice-call";
import { Loader2, Save } from "lucide-react";

// Lista expandida de vozes disponíveis
const VOICES = [
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah (Feminina)" },
  { id: "CwhRBWXzGAHq8TQ4Fs17", name: "Roger (Masculina)" },
  { id: "GBv7mTt0atIp3Br8iCZE", name: "Thomas (Britânica)" },
  { id: "9BWtsMINqrJLrRacOk9x", name: "Aria (Feminina)" },
  { id: "FGY2WhTYpPnrIDTdsKH5", name: "Laura (Feminina)" },
  { id: "IKne3meq5aSn9XLyUdCD", name: "Charlie (Masculina)" },
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "George (Masculina)" },
  { id: "N2lVS1w4EtoT3dr4eOWO", name: "Callum (Masculina)" },
  { id: "SAz9YHcvj6GT2YYXdXww", name: "River (Neutro)" },
  { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam (Masculina)" },
];

// Categorias de agentes
const CATEGORIES = [
  "Atendimento",
  "Vendas",
  "Suporte",
  "Cobrança",
  "Marketing",
  "RH",
  "Outros"
];

// Modelos de IA disponíveis
const AI_MODELS = [
  { id: "gpt-4o-mini", name: "GPT-4o Mini (Rápido e econômico)" },
  { id: "gpt-4o", name: "GPT-4o (Mais completo)" },
  { id: "claude-3-5-sonnet", name: "Claude 3.5 Sonnet (Antropic)" },
  { id: "eleven_multilingual_v2", name: "Eleven Labs Multilingual V2 (Voz)" },
];

interface AgentConfigProps {
  isNew?: boolean;
}

const AgentConfig = ({ isNew = false }: AgentConfigProps) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { textToSpeech, playAudio } = useVoiceCall();
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [testMessage, setTestMessage] = useState("");

  // Estados do formulário
  const [formState, setFormState] = useState({
    name: "",
    description: "",
    category: "Atendimento",
    voiceId: "EXAVITQu4vr4xnSDxMaL", // Sarah como padrão
    status: "active",
    instructions: "",
    responseStyle: "Formal e direto",
    defaultGreeting: "",
    maxResponseLength: "150",
    knowledge: "",
    aiModel: "gpt-4o-mini", // Modelo padrão
    conversationPrompt: "", // Prompt personalizado para conversação
    webhookUrl: "", // URL para webhook de eventos da chamada
    phoneNumber: "", // Número para testes
  });

  useEffect(() => {
    if (!isNew && id) {
      // Simulação de carregamento de dados do agente
      setIsLoading(true);
      setTimeout(() => {
        // Simulando dados de exemplo
        setFormState({
          name: `Agente ${id}`,
          description: "Descrição do agente exemplo",
          category: "Atendimento",
          voiceId: "EXAVITQu4vr4xnSDxMaL",
          status: "active",
          instructions: "Este agente deve ser polido e direto nas respostas.",
          responseStyle: "Formal e detalhado",
          defaultGreeting: "Olá, como posso ajudar você hoje?",
          maxResponseLength: "200",
          knowledge: "Informações sobre produtos e serviços da empresa.\n\nPerguntas frequentes sobre atendimento ao cliente.",
          aiModel: "gpt-4o-mini",
          conversationPrompt: "Você é um assistente virtual especializado em atendimento ao cliente.",
          webhookUrl: "",
          phoneNumber: "",
        });
        setIsLoading(false);
      }, 1000);
    } else {
      // Valores padrão para um novo agente
      setFormState({
        ...formState,
        defaultGreeting: "Olá, como posso ajudar você hoje?",
        instructions: "Seja cordial e objetivo nas respostas.",
        conversationPrompt: "Você é um assistente virtual especializado em atendimento ao cliente.",
      });
    }
  }, [id, isNew]);

  const handleFormChange = (field: string, value: string) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  const handleTestVoice = async () => {
    setIsTesting(true);
    const textToTest = testMessage || `Olá, eu sou ${formState.name}, um assistente virtual.`;
    
    try {
      const audioContent = await textToSpeech({
        text: textToTest,
        voiceId: formState.voiceId
      });
      
      if (audioContent) {
        playAudio(audioContent);
      }
    } catch (error) {
      console.error('Erro ao testar voz:', error);
      toast.error('Falha ao testar a voz do agente');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulação de salvamento
    setTimeout(() => {
      toast.success(isNew ? 'Agente criado com sucesso!' : 'Agente atualizado com sucesso!');
      setIsLoading(false);
      navigate('/agents');
    }, 1000);
  };

  if (isLoading && !isNew) {
    return (
      <Layout>
        <div className="container mx-auto p-6 flex items-center justify-center min-h-[70vh]">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin text-violet-600 mx-auto" />
            <p className="mt-4 text-muted-foreground">Carregando configurações do agente...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <div className="flex flex-col mb-8">
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-700 to-violet-500">
            {isNew ? "Criar Novo Agente" : `Configurar Agente: ${formState.name}`}
          </h1>
          <p className="mt-1 text-muted-foreground max-w-3xl">
            {isNew 
              ? "Configure um novo agente virtual com suas instruções personalizadas." 
              : "Personalize o comportamento, voz e instruções para este agente."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-8">
              <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
              <TabsTrigger value="ai">Configuração de IA</TabsTrigger>
              <TabsTrigger value="voice">Voz e Comunicação</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Básicas</CardTitle>
                  <CardDescription>
                    Configure as informações básicas do agente.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome do Agente</Label>
                      <Input 
                        id="name"
                        value={formState.name} 
                        onChange={(e) => handleFormChange('name', e.target.value)} 
                        placeholder="Ex: Sofia Atendimento"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Descrição</Label>
                      <Textarea 
                        id="description"
                        value={formState.description} 
                        onChange={(e) => handleFormChange('description', e.target.value)} 
                        placeholder="Descreva o papel deste agente em seu negócio"
                        rows={3}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="category">Categoria</Label>
                      <Select 
                        value={formState.category}
                        onValueChange={(value) => handleFormChange('category', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(category => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select 
                        value={formState.status}
                        onValueChange={(value) => handleFormChange('status', value as any)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Ativo</SelectItem>
                          <SelectItem value="paused">Pausado</SelectItem>
                          <SelectItem value="inactive">Inativo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="ai" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Configuração de IA</CardTitle>
                  <CardDescription>
                    Personalize como o agente deve se comportar e responder.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="aiModel">Modelo de IA</Label>
                      <Select 
                        value={formState.aiModel}
                        onValueChange={(value) => handleFormChange('aiModel', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um modelo" />
                        </SelectTrigger>
                        <SelectContent>
                          {AI_MODELS.map(model => (
                            <SelectItem key={model.id} value={model.id}>{model.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="conversationPrompt">Prompt de Conversação</Label>
                      <Textarea 
                        id="conversationPrompt"
                        value={formState.conversationPrompt} 
                        onChange={(e) => handleFormChange('conversationPrompt', e.target.value)} 
                        placeholder="Instruções para a IA sobre como se comportar nas conversas"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="instructions">Instruções para o Agente</Label>
                      <Textarea 
                        id="instructions"
                        value={formState.instructions} 
                        onChange={(e) => handleFormChange('instructions', e.target.value)} 
                        placeholder="Descreva detalhadamente como o agente deve se comportar e responder"
                        rows={4}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="responseStyle">Estilo de Resposta</Label>
                      <Select 
                        value={formState.responseStyle}
                        onValueChange={(value) => handleFormChange('responseStyle', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um estilo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Formal e direto">Formal e direto</SelectItem>
                          <SelectItem value="Formal e detalhado">Formal e detalhado</SelectItem>
                          <SelectItem value="Informal e amigável">Informal e amigável</SelectItem>
                          <SelectItem value="Técnico e preciso">Técnico e preciso</SelectItem>
                          <SelectItem value="Empático e atencioso">Empático e atencioso</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="maxResponseLength">Comprimento Máximo de Resposta</Label>
                      <Input 
                        id="maxResponseLength"
                        type="number" 
                        value={formState.maxResponseLength} 
                        onChange={(e) => handleFormChange('maxResponseLength', e.target.value)} 
                        placeholder="Número máximo de caracteres"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="knowledge">Base de Conhecimento</Label>
                      <Textarea 
                        id="knowledge"
                        value={formState.knowledge} 
                        onChange={(e) => handleFormChange('knowledge', e.target.value)} 
                        placeholder="Adicione informações específicas que o agente deve conhecer"
                        rows={6}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="voice" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Configuração de Voz e Chamadas</CardTitle>
                  <CardDescription>
                    Personalize como o agente deve soar em chamadas.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="voiceId">Voz do Agente</Label>
                      <Select 
                        value={formState.voiceId}
                        onValueChange={(value) => handleFormChange('voiceId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma voz" />
                        </SelectTrigger>
                        <SelectContent>
                          {VOICES.map(voice => (
                            <SelectItem key={voice.id} value={voice.id}>{voice.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="defaultGreeting">Saudação Padrão</Label>
                      <Textarea 
                        id="defaultGreeting"
                        value={formState.defaultGreeting} 
                        onChange={(e) => handleFormChange('defaultGreeting', e.target.value)} 
                        placeholder="Como o agente deve iniciar uma conversa"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber">Número para Teste (Twilio)</Label>
                      <Input 
                        id="phoneNumber"
                        type="tel"
                        value={formState.phoneNumber} 
                        onChange={(e) => handleFormChange('phoneNumber', e.target.value)} 
                        placeholder="Ex: +5511999999999"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="webhookUrl">URL de Webhook (opcional)</Label>
                      <Input 
                        id="webhookUrl"
                        type="url"
                        value={formState.webhookUrl} 
                        onChange={(e) => handleFormChange('webhookUrl', e.target.value)} 
                        placeholder="https://seu-dominio.com/webhooks/calls"
                      />
                      <p className="text-xs text-muted-foreground">URL para receber atualizações de status das chamadas</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="testVoice">Testar Voz</Label>
                      <div className="flex flex-col gap-2">
                        <Textarea 
                          id="testVoice"
                          value={testMessage} 
                          onChange={(e) => setTestMessage(e.target.value)} 
                          placeholder={`Digite um texto para testar a voz. Padrão: "Olá, eu sou ${formState.name}, um assistente virtual."`}
                          rows={2}
                        />
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={handleTestVoice}
                          disabled={isTesting}
                          className="self-start"
                        >
                          {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Testar Voz
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end space-x-4">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => navigate('/agents')}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              {isNew ? "Criar Agente" : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default AgentConfig;
