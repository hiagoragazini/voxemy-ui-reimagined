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
  
  // Lê o tipo da URL
  const urlAgentType = searchParams.get('type') as 'text' | 'voice' | 'hybrid' | null;
  
  console.log("=== DEBUG AGENT CONFIG ===");
  console.log("URL Agent Type:", urlAgentType);
  console.log("Is New:", isNew);
  console.log("Agent ID:", id);
  
  const { textToSpeech, playAudio } = useVoiceCall();
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [testMessage, setTestMessage] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveAttempts, setSaveAttempts] = useState(0);

  // Estados do formulário com valores padrão seguros
  const [formState, setFormState] = useState({
    name: "",
    description: "",
    category: "Atendimento",
    type: urlAgentType || 'text' as 'text' | 'voice' | 'hybrid',
    voiceId: "",
    status: "active",
    instructions: "",
    responseStyle: "",
    defaultGreeting: "",
    maxResponseLength: "150",
    knowledge: "",
    aiModel: "gpt-4o-mini",
    conversationPrompt: "",
    webhookUrl: "",
    phoneNumber: "",
  });

  // Validação do ID do agente para páginas de edição
  const isValidAgentId = (agentId: string | undefined): boolean => {
    if (!agentId) return false;
    // UUID validation pattern
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidPattern.test(agentId);
  };

  // Função para configurar valores padrão baseados no tipo
  const setDefaultsByType = (agentType: 'text' | 'voice' | 'hybrid') => {
    console.log("Configurando valores padrão para tipo:", agentType);
    
    const defaultGreeting = agentType === 'text' 
      ? "Olá! 👋 Sou seu assistente virtual. Como posso ajudar você hoje?"
      : "Olá, como posso ajudar você hoje?";
    
    const defaultInstructions = agentType === 'text'
      ? "Seja cordial, use emojis ocasionalmente e mantenha as respostas concisas e úteis para WhatsApp."
      : "Seja cordial e objetivo nas respostas.";

    const defaultPrompt = agentType === 'text' 
      ? "Você é um assistente virtual especializado em atendimento ao cliente via WhatsApp. Seja amigável e use linguagem adequada para mensagens de texto."
      : "Você é um assistente virtual especializado em atendimento ao cliente.";

    // Set default voice_id only for voice and hybrid agents
    const defaultVoiceId = (agentType === 'voice' || agentType === 'hybrid') 
      ? VOICE_IDS.SARAH 
      : '';

    setFormState(prev => ({
      ...prev,
      type: agentType,
      defaultGreeting,
      instructions: defaultInstructions,
      conversationPrompt: defaultPrompt,
      responseStyle: "Formal e direto",
      status: "active",
      voiceId: defaultVoiceId,
    }));
  };

  // VERIFICAÇÃO DE REDIRECIONAMENTO - Para novos agentes sem tipo
  useEffect(() => {
    if (isNew && !urlAgentType) {
      console.log("Redirecionando para seleção de tipo...");
      navigate('/agents/new');
      return;
    }
  }, [isNew, urlAgentType, navigate]);

  // CARREGAMENTO DE DADOS - Apenas para edição com ID válido
  useEffect(() => {
    if (!isNew && id) {
      // Validar ID antes de tentar buscar
      if (!isValidAgentId(id)) {
        console.error("ID do agente inválido:", id);
        setLoadError("ID do agente inválido");
        toast.error("ID do agente inválido");
        navigate('/agents');
        return;
      }

      setIsLoading(true);
      setLoadError(null);
      
      const fetchAgent = async () => {
        try {
          console.log("Buscando agente com ID:", id);
          
          const { data, error } = await supabase
            .from('agents')
            .select('*')
            .eq('id', id)
            .maybeSingle(); // Use maybeSingle instead of single to avoid errors when no data
          
          if (error) {
            console.error('Erro ao carregar agente:', error);
            throw new Error(`Erro do banco: ${error.message}`);
          }
          
          if (!data) {
            console.error('Agente não encontrado com ID:', id);
            throw new Error('Agente não encontrado');
          }
          
          console.log("Agente carregado do Supabase:", data);
          
          // Type-safe conversion with validation
          const validType: 'text' | 'voice' | 'hybrid' = 
            ['text', 'voice', 'hybrid'].includes(data.type) 
              ? data.type as 'text' | 'voice' | 'hybrid'
              : 'text';
          
          // Preencher o formulário com os dados do agente
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
          console.error('Erro ao buscar agente:', error);
          const errorMessage = error.message || 'Erro desconhecido ao carregar agente';
          setLoadError(errorMessage);
          toast.error(errorMessage);
          
          // Se é erro de não encontrado, redireciona para lista
          if (error.message.includes('não encontrado')) {
            setTimeout(() => navigate('/agents'), 2000);
          }
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchAgent();
    } else if (isNew && urlAgentType) {
      // Configurar valores padrão para novo agente
      setDefaultsByType(urlAgentType);
    }
  }, [id, isNew, urlAgentType, navigate]);

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
    // Voice ID is only required for voice and hybrid agents
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
        type: formState.type,
        voice_id: formState.type === 'text' ? null : formState.voiceId || null,
        status: formState.status || 'active',
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
      
      let agentId = id;
      
      if (isNew) {
        // Inserir novo agente
        const { data, error } = await supabase
          .from('agents')
          .insert(agentData)
          .select();
          
        console.log("Resultado da inserção:", { data, error });
        
        if (error) {
          throw error;
        }
        
        if (data && data.length > 0) {
          agentId = data[0].id;
          console.log("ID do agente recém-criado:", agentId);
        } else {
          throw new Error("Nenhum dado retornado após a inserção do agente");
        }
      } else if (id && isValidAgentId(id)) {
        // Atualizar agente existente
        const { data, error } = await supabase
          .from('agents')
          .update(agentData)
          .eq('id', id)
          .select();
          
        console.log("Resultado da atualização:", { data, error });
        
        if (error) {
          throw error;
        }
      } else {
        throw new Error("ID do agente inválido para atualização");
      }
      
      if (!agentId) {
        console.error("ID do agente não encontrado após salvamento");
        toast.error("Erro ao recuperar ID do agente após salvamento");
        return;
      }
      
      const agentTypeText = formState.type === 'text' ? 'de texto' : formState.type === 'voice' ? 'de voz' : 'híbrido';
      toast.success(isNew ? `Agente ${agentTypeText} criado com sucesso!` : `Agente ${agentTypeText} atualizado com sucesso!`);
      
      // Verificar se o agente realmente foi criado
      if (isNew && agentId) {
        const { data: verifyData, error: verifyError } = await supabase
          .from('agents')
          .select('*')
          .eq('id', agentId)
          .maybeSingle();
          
        if (verifyError || !verifyData) {
          console.error('Erro na verificação do agente após criação:', verifyError);
          toast.warning('O agente foi criado, mas há uma possível demora na sincronização. Aguarde alguns segundos.');
        } else {
          console.log("Verificação do agente bem-sucedida:", verifyData);
          toast.success(`Agente "${verifyData.name}" criado e verificado com sucesso!`);
        }
      }
      
      // Navegar de volta para a lista de agentes
      setTimeout(() => {
        navigate(`/agents?${isNew ? 'created=true' : 'updated=true'}${agentId ? `&id=${agentId}` : ''}`);
      }, 1000);
      
    } catch (error: any) {
      console.error('Exceção ao salvar agente:', error);
      toast.error(`Erro ao ${isNew ? 'criar' : 'atualizar'} agente: ${error.message || 'Erro desconhecido'}`);
      setSaveError(error.message || 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state para busca de dados
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

  // Error state para carregamento
  if (loadError) {
    return (
      <Layout>
        <div className="container mx-auto p-6">
          <Alert variant="destructive" className="max-w-2xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro ao carregar agente</AlertTitle>
            <AlertDescription>
              {loadError}
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

  // Se é novo agente E não tem tipo na URL, não renderiza nada (vai redirecionar)
  if (isNew && !urlAgentType) {
    return null;
  }

  console.log("=== RENDERIZANDO FORMULÁRIO ===");
  console.log("Tipo do agente:", formState.type);

  // Configuração dinâmica das abas baseada no tipo
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

  // Se a aba ativa não está disponível para o tipo atual, volta para 'basic'
  useEffect(() => {
    if (!availableTabs.includes(activeTab)) {
      setActiveTab('basic');
    }
  }, [formState.type, activeTab, availableTabs]);

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
            
            {/* Aba WhatsApp - Aparece para agentes de texto e híbridos */}
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

            {/* Aba Voz - Aparece para agentes de voz e híbridos */}
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
          
          {saveError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro ao salvar o agente</AlertTitle>
              <AlertDescription>{saveError}</AlertDescription>
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
