import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/dashboard/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useVoiceCall } from "@/hooks/use-voice-call";
import { Loader2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { VOICES, VOICE_IDS } from "@/constants/voices";

// Lista expandida de vozes disponíveis
const VOICES_OPTIONS = VOICES;

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
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveAttempts, setSaveAttempts] = useState(0);

  // Estados do formulário
  const [formState, setFormState] = useState({
    name: "",
    description: "",
    category: "Atendimento",
    voiceId: "EXAVITQu4vr4xnSDxMaL", // Sarah como padrão
    status: "active", // Garantir que o status padrão seja active
    instructions: "",
    responseStyle: "",
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
      // Carregamento real de dados do agente do Supabase
      setIsLoading(true);
      
      const fetchAgent = async () => {
        try {
          const { data, error } = await supabase
            .from('agents')
            .select('*')
            .eq('id', id)
            .single();
          
          if (error) {
            console.error('Erro ao carregar agente:', error);
            toast.error('Erro ao carregar dados do agente');
            setIsLoading(false);
            return;
          }
          
          if (data) {
            console.log("Agente carregado do Supabase:", data);
            // Preencher o formulário com os dados do agente
            setFormState({
              name: data.name || '',
              description: data.description || '',
              category: data.category || 'Atendimento',
              voiceId: data.voice_id || VOICE_IDS.SARAH,
              status: data.status || 'active',
              instructions: data.instructions || 'Este agente deve ser polido e direto nas respostas.',
              responseStyle: data.response_style || 'Formal e detalhado',
              defaultGreeting: data.default_greeting || 'Olá, como posso ajudar você hoje?',
              maxResponseLength: data.max_response_length?.toString() || '200',
              knowledge: data.knowledge || 'Informações sobre produtos e serviços da empresa.\n\nPerguntas frequentes sobre atendimento ao cliente.',
              aiModel: data.ai_model || 'gpt-4o-mini',
              conversationPrompt: data.conversation_prompt || 'Você é um assistente virtual especializado em atendimento ao cliente.',
              webhookUrl: data.webhook_url || '',
              phoneNumber: data.phone_number || '',
            });
          }
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchAgent();
    } else {
      // Valores padrão para um novo agente
      setFormState({
        ...formState,
        defaultGreeting: "Olá, como posso ajudar você hoje?",
        instructions: "Seja cordial e objetivo nas respostas.",
        conversationPrompt: "Você é um assistente virtual especializado em atendimento ao cliente.",
        responseStyle: "Formal e direto",
        status: "active", // Garantir que o status padrão seja active
        voiceId: VOICE_IDS.SARAH, // Garantir que tenha uma voz padrão
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

  const validateForm = () => {
    if (!formState.name.trim()) {
      toast.error("Nome do agente é obrigatório");
      return false;
    }
    if (!formState.category) {
      toast.error("Categoria é obrigatória");
      return false;
    }
    if (!formState.voiceId) {
      toast.error("Voz do agente é obrigatória");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSaveError(null);
    setIsLoading(true);
    setSaveAttempts(prev => prev + 1);
    
    try {
      console.log(`Tentativa ${saveAttempts + 1} de salvar agente no Supabase...`);
      
      // Preparar os dados para salvar no Supabase
      const agentData = {
        name: formState.name,
        description: formState.description,
        category: formState.category,
        voice_id: formState.voiceId,
        status: formState.status || 'active', // Garantir que tenha um status
        instructions: formState.instructions,
        response_style: formState.responseStyle,
        default_greeting: formState.defaultGreeting,
        max_response_length: parseInt(formState.maxResponseLength) || 150,
        knowledge: formState.knowledge,
        ai_model: formState.aiModel,
        conversation_prompt: formState.conversationPrompt,
        webhook_url: formState.webhookUrl,
        phone_number: formState.phoneNumber,
      };
      
      console.log("Dados do agente a serem salvos:", agentData);
      
      let result;
      
      if (isNew) {
        // Inserir novo agente
        result = await supabase
          .from('agents')
          .insert(agentData)
          .select();
          
        console.log("Resultado da inserção:", result);
      } else if (id) {
        // Atualizar agente existente
        result = await supabase
          .from('agents')
          .update(agentData)
          .eq('id', id)
          .select();
          
        console.log("Resultado da atualização:", result);
      }
      
      const { data, error } = result || {};
      
      if (error) {
        console.error('Erro ao salvar agente:', error);
        toast.error(`Erro ao ${isNew ? 'criar' : 'atualizar'} agente: ${error.message}`);
        setSaveError(error.message);
        
        // Se for um erro de conexão ou timeout, tenta novamente
        if (error.message.includes("timeout") || error.message.includes("connection") && saveAttempts < 3) {
          toast.info("Problemas de conexão detectados. Tentando novamente...");
          setTimeout(() => handleSubmit(e), 1000);
        }
        return;
      }
      
      console.log("Agente salvo com sucesso:", data);
      const agentId = isNew ? data?.[0]?.id : id;
      
      if (!agentId) {
        console.error("ID do agente não encontrado após salvamento");
        toast.error("Erro ao recuperar ID do agente após salvamento");
        return;
      }
      
      toast.success(isNew ? 'Agente criado com sucesso!' : 'Agente atualizado com sucesso!');
      
      // Verificar se o agente realmente foi criado com uma consulta de confirmação
      if (isNew && agentId) {
        const { data: verifyData, error: verifyError } = await supabase
          .from('agents')
          .select('*')
          .eq('id', agentId)
          .single();
          
        if (verifyError || !verifyData) {
          console.error('Erro na verificação do agente após criação:', verifyError);
          toast.warning('O agente foi criado, mas há uma possível demora na sincronização. Aguarde alguns segundos.');
        } else {
          console.log("Verificação do agente bem-sucedida:", verifyData);
          toast.success(`Agente "${verifyData.name}" criado e verificado com sucesso!`);
        }
      }
      
      // Garantir que a atualização foi bem-sucedida com múltiplas verificações
      const verifyAgentSaved = async () => {
        try {
          console.log("Verificando se o agente foi salvo corretamente...");
          const { data: allAgents } = await supabase.from('agents').select('*');
          console.log(`Verificação encontrou ${allAgents?.length || 0} agentes no total`);
          
          // Registrar todos os agentes para depuração
          allAgents?.forEach(agent => {
            console.log(`Agente encontrado: ${agent.id} - ${agent.name}`);
          });
          
          // Aguardar um breve momento para garantir que a inserção foi processada
          setTimeout(() => {
            // Redirecionar para a página de agentes com parâmetros de URL para indicar o sucesso
            navigate(`/agents?${isNew ? 'created=true' : 'updated=true'}${agentId ? `&id=${agentId}` : ''}`);
          }, 500);
        } catch (err) {
          console.error("Erro na verificação final:", err);
        }
      };
      
      verifyAgentSaved();
      
    } catch (error: any) {
      console.error('Exceção ao salvar agente:', error);
      toast.error(`Erro ao ${isNew ? 'criar' : 'atualizar'} agente: ${error.message || 'Erro desconhecido'}`);
      setSaveError(error.message || 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
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
                          {VOICES_OPTIONS.map(voice => (
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
          
          {saveError && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md">
              <p className="font-medium">Erro ao salvar o agente</p>
              <p className="text-sm mt-1">{saveError}</p>
            </div>
          )}
          
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
