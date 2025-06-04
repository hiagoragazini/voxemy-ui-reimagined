import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
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
import { Loader2, Save, ArrowLeft, ArrowRight, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { VOICES, VOICE_IDS } from "@/constants/voices";
import { WhatsAppConfigTab } from "@/components/agents/WhatsAppConfigTab";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
  const [searchParams] = useSearchParams();
  
  console.log("=== AGENT CONFIG DEBUG ===");
  console.log("Is New:", isNew);
  console.log("Agent ID:", id);
  console.log("URL Params:", Object.fromEntries(searchParams.entries()));

  // EARLY VALIDATION - Check ID for edit mode
  if (!isNew && !id) {
    console.error("ID do agente é necessário para edição");
    return (
      <Layout>
        <div className="container mx-auto p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro de Navegação</AlertTitle>
            <AlertDescription>
              ID do agente não fornecido. 
              <Button onClick={() => navigate('/agents')} variant="outline" className="ml-4">
                Voltar para Lista
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  // EARLY VALIDATION - UUID format for edit mode
  const isValidUUID = (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  if (!isNew && id && !isValidUUID(id)) {
    console.error("ID do agente inválido:", id);
    return (
      <Layout>
        <div className="container mx-auto p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>ID Inválido</AlertTitle>
            <AlertDescription>
              O ID do agente fornecido não é válido.
              <Button onClick={() => navigate('/agents')} variant="outline" className="ml-4">
                Voltar para Lista
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  // Get agent type from URL for new agents only
  const urlAgentType = isNew ? searchParams.get('type') as 'text' | 'voice' | 'hybrid' | null : null;
  
  console.log("URL Agent Type (new only):", urlAgentType);

  // EARLY VALIDATION - Type required for new agents
  if (isNew && !urlAgentType) {
    console.log("Redirecionando para seleção de tipo - tipo não fornecido");
    navigate('/agents/new');
    return null;
  }

  // STATE MANAGEMENT
  const { textToSpeech, playAudio } = useVoiceCall();
  const [isLoading, setIsLoading] = useState(!isNew); // Loading true for existing agents
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [testMessage, setTestMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  // SAFE INITIAL FORM STATE
  const getInitialFormState = () => {
    const defaultType = isNew ? (urlAgentType || 'text') : 'text';
    
    return {
      name: "",
      description: "",
      category: "Atendimento",
      type: defaultType as 'text' | 'voice' | 'hybrid',
      voiceId: "",
      status: "active" as const,
      instructions: "Este agente deve ser polido e direto nas respostas.",
      responseStyle: "Formal e detalhado",
      defaultGreeting: "Olá, como posso ajudar você hoje?",
      maxResponseLength: "200",
      knowledge: "Informações sobre produtos e serviços da empresa.\n\nPerguntas frequentes sobre atendimento ao cliente.",
      aiModel: "gpt-4o-mini",
      conversationPrompt: "Você é um assistente virtual especializado em atendimento ao cliente.",
      webhookUrl: "",
      phoneNumber: "",
    };
  };

  const [formState, setFormState] = useState(getInitialFormState);

  // EFFECT 1: Load existing agent data (edit mode only)
  useEffect(() => {
    if (!isNew && id && isValidUUID(id)) {
      console.log("Carregando dados do agente:", id);
      setIsLoading(true);
      setError(null);
      
      const fetchAgent = async () => {
        try {
          const { data, error } = await supabase
            .from('agents')
            .select('*')
            .eq('id', id)
            .maybeSingle();
          
          if (error) {
            console.error('Erro Supabase:', error);
            throw new Error(`Erro do banco: ${error.message}`);
          }
          
          if (!data) {
            console.error('Agente não encontrado:', id);
            throw new Error('Agente não encontrado');
          }
          
          console.log("Agente carregado:", data);
          
          // SAFE TYPE CONVERSION
          const validType: 'text' | 'voice' | 'hybrid' = 
            ['text', 'voice', 'hybrid'].includes(data.type) 
              ? data.type as 'text' | 'voice' | 'hybrid'
              : 'text';
          
          // UPDATE FORM STATE WITH LOADED DATA
          setFormState({
            name: data.name || '',
            description: data.description || '',
            category: data.category || 'Atendimento',
            type: validType,
            voiceId: data.voice_id || '',
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
          
          toast.success(`Agente "${data.name}" carregado com sucesso!`);
          
        } catch (error: any) {
          console.error('Erro ao carregar agente:', error);
          const errorMessage = error.message || 'Erro desconhecido';
          setError(errorMessage);
          toast.error(errorMessage);
          
          // Navigate back if not found
          if (error.message.includes('não encontrado')) {
            setTimeout(() => navigate('/agents'), 2000);
          }
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchAgent();
    }
  }, [id, isNew, navigate]);

  // EFFECT 2: Set defaults for new agents
  useEffect(() => {
    if (isNew && urlAgentType) {
      console.log("Configurando valores padrão para novo agente:", urlAgentType);
      
      const defaultGreeting = urlAgentType === 'text' 
        ? "Olá! 👋 Sou seu assistente virtual. Como posso ajudar você hoje?"
        : "Olá, como posso ajudar você hoje?";
      
      const defaultInstructions = urlAgentType === 'text'
        ? "Seja cordial, use emojis ocasionalmente e mantenha as respostas concisas e úteis para WhatsApp."
        : "Seja cordial e objetivo nas respostas.";

      const defaultPrompt = urlAgentType === 'text' 
        ? "Você é um assistente virtual especializado em atendimento ao cliente via WhatsApp. Seja amigável e use linguagem adequada para mensagens de texto."
        : "Você é um assistente virtual especializado em atendimento ao cliente.";

      const defaultVoiceId = (urlAgentType === 'voice' || urlAgentType === 'hybrid') 
        ? VOICE_IDS.SARAH 
        : '';

      setFormState(prev => ({
        ...prev,
        type: urlAgentType,
        defaultGreeting,
        instructions: defaultInstructions,
        conversationPrompt: defaultPrompt,
        responseStyle: "Formal e direto",
        voiceId: defaultVoiceId,
      }));
    }
  }, [isNew, urlAgentType]);

  // LOADING STATE
  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto p-6 flex items-center justify-center min-h-[70vh]">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin text-violet-600 mx-auto" />
            <p className="mt-4 text-muted-foreground">
              {isNew ? 'Configurando novo agente...' : 'Carregando configurações do agente...'}
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  // ERROR STATE
  if (error) {
    return (
      <Layout>
        <div className="container mx-auto p-6">
          <Alert variant="destructive" className="max-w-2xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro ao carregar agente</AlertTitle>
            <AlertDescription>
              {error}
              <div className="mt-4">
                <Button onClick={() => navigate('/agents')} variant="outline">
                  Voltar para lista de agentes
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  // FORM HANDLERS
  const handleFormChange = (field: string, value: string) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  const handleTestVoice = async () => {
    if (!formState.voiceId) {
      toast.error("Selecione uma voz primeiro");
      return;
    }

    setIsTesting(true);
    const textToTest = testMessage || `Olá, eu sou ${formState.name || 'um assistente virtual'}.`;
    
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
    if ((formState.type === 'voice' || formState.type === 'hybrid') && !formState.voiceId) {
      toast.error("Voz do agente é obrigatória para agentes de voz e híbridos");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setError(null);
    setIsSaving(true);
    
    try {
      console.log('Salvando agente...');
      
      const agentData = {
        name: formState.name,
        description: formState.description,
        category: formState.category,
        type: formState.type,
        voice_id: formState.type === 'text' ? null : formState.voiceId || null,
        status: formState.status || 'active',
        instructions: formState.instructions,
        response_style: formState.responseStyle,
        default_greeting: formState.defaultGreeting,
        max_response_length: parseInt(formState.maxResponseLength) || 200,
        knowledge: formState.knowledge,
        ai_model: formState.aiModel,
        conversation_prompt: formState.conversationPrompt,
        webhook_url: formState.webhookUrl,
        phone_number: formState.phoneNumber,
      };
      
      console.log("Dados do agente:", agentData);
      
      let result;
      
      if (isNew) {
        const { data, error } = await supabase
          .from('agents')
          .insert(agentData)
          .select()
          .single();
          
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from('agents')
          .update(agentData)
          .eq('id', id!)
          .select()
          .single();
          
        if (error) throw error;
        result = data;
      }
      
      const agentTypeText = formState.type === 'text' ? 'de texto' : formState.type === 'voice' ? 'de voz' : 'híbrido';
      toast.success(isNew ? `Agente ${agentTypeText} criado com sucesso!` : `Agente ${agentTypeText} atualizado com sucesso!`);
      
      setTimeout(() => {
        navigate(`/agents?${isNew ? 'created=true' : 'updated=true'}&id=${result.id}`);
      }, 1000);
      
    } catch (error: any) {
      console.error('Erro ao salvar agente:', error);
      const errorMessage = error.message || 'Erro desconhecido';
      toast.error(`Erro ao ${isNew ? 'criar' : 'atualizar'} agente: ${errorMessage}`);
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  // TAB CONFIGURATION
  const getTabsForAgentType = () => {
    if (formState.type === 'text') {
      return ['basic', 'ai', 'whatsapp'];
    } else if (formState.type === 'voice') {
      return ['basic', 'ai', 'voice'];
    } else if (formState.type === 'hybrid') {
      return ['basic', 'ai', 'whatsapp', 'voice'];
    }
    return ['basic', 'ai'];
  };

  const getTabLabel = (tabKey: string) => {
    const labels = {
      basic: 'Informações Básicas',
      ai: 'Configuração de IA',
      whatsapp: 'WhatsApp e Comunicação',
      voice: 'Voz e Comunicação'
    };
    return labels[tabKey as keyof typeof labels] || tabKey;
  };

  const availableTabs = getTabsForAgentType();

  // Auto-correct active tab if not available
  useEffect(() => {
    if (!availableTabs.includes(activeTab)) {
      setActiveTab('basic');
    }
  }, [formState.type, activeTab, availableTabs]);

  console.log("=== RENDERIZANDO FORMULÁRIO ===");
  console.log("Tipo do agente:", formState.type);
  console.log("Abas disponíveis:", availableTabs);

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <div className="flex flex-col mb-8">
          <div className="flex items-center gap-4 mb-4">
            {isNew && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/agents/new')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para Seleção
              </Button>
            )}
            {!isNew && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/agents')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para Lista
              </Button>
            )}
            <div className="flex items-center gap-2">
              {formState.type === 'voice' ? (
                <span className="text-2xl">🎤</span>
              ) : formState.type === 'hybrid' ? (
                <span className="text-2xl">🔄</span>
              ) : (
                <span className="text-2xl">💬</span>
              )}
              <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                {formState.type === 'voice' ? 'Agente de Voz' : 
                 formState.type === 'hybrid' ? 'Agente Híbrido' : 
                 'Agente de Texto'}
              </span>
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-700 to-violet-500">
            {isNew ? "Configurar Novo Agente" : `Editar Agente: ${formState.name}`}
          </h1>
          <p className="mt-1 text-muted-foreground max-w-3xl">
            {isNew 
              ? `Configure seu novo agente ${formState.type === 'voice' ? 'de voz' : formState.type === 'hybrid' ? 'híbrido' : 'de texto'} com instruções personalizadas.` 
              : "Personalize o comportamento, voz e instruções para este agente."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className={`grid grid-cols-${availableTabs.length} mb-8`}>
              {availableTabs.map(tab => (
                <TabsTrigger key={tab} value={tab}>
                  {getTabLabel(tab)}
                </TabsTrigger>
              ))}
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
                        placeholder={formState.type === 'text' ? "Ex: Sofia WhatsApp" : "Ex: Sofia Atendimento"}
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
            
            {(formState.type === 'text' || formState.type === 'hybrid') && (
              <TabsContent value="whatsapp" className="space-y-4">
                <WhatsAppConfigTab
                  formState={{
                    phoneNumber: formState.phoneNumber,
                    webhookUrl: formState.webhookUrl,
                    defaultGreeting: formState.defaultGreeting,
                    maxResponseLength: formState.maxResponseLength,
                  }}
                  onFormChange={handleFormChange}
                  agentName={formState.name || "Agente"}
                  instructions={formState.instructions}
                  responseStyle={formState.responseStyle}
                  knowledge={formState.knowledge}
                />
              </TabsContent>
            )}

            {(formState.type === 'voice' || formState.type === 'hybrid') && (
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
                            placeholder={`Digite um texto para testar a voz. Padrão: "Olá, eu sou ${formState.name || 'um assistente virtual'}."`}
                            rows={2}
                          />
                          <Button 
                            type="button" 
                            variant="outline"
                            onClick={handleTestVoice}
                            disabled={isTesting || !formState.voiceId}
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
            )}
          </Tabs>
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro ao salvar o agente</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
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
              disabled={isSaving}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
