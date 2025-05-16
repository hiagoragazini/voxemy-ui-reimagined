
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Loader2, Phone, ExternalLink, CheckCircle2, AlertCircle, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// URLs de exemplo de arquivos MP3 simples (tons telefônicos)
const SAMPLE_AUDIO_URLS = [
  {
    name: "Dial Tone",
    url: "https://www.soundjay.com/phone/sounds/dial-tone-1.mp3",
    description: "Tom de discagem telefônica padrão (800Hz)"
  },
  {
    name: "Busy Signal",
    url: "https://www.soundjay.com/phone/sounds/busy-signal-1.mp3",
    description: "Sinal de ocupado (480Hz + 620Hz)"
  },
  {
    name: "Ringing Phone",
    url: "https://www.soundjay.com/phone/sounds/phone-ringing-1.mp3",
    description: "Telefone tocando (440Hz + 480Hz)"
  }
];

export function TwilioManualTester() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [twimlBinId, setTwimlBinId] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [twimlSnippet, setTwimlSnippet] = useState('<Response>\n  <Play>URL_DO_AUDIO</Play>\n</Response>');
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("setup");
  const [phoneValid, setPhoneValid] = useState(true);
  
  // Validar formato do número de telefone
  const validatePhone = (phone: string) => {
    // Limpa o número para conter apenas dígitos
    const cleanedPhone = phone.replace(/\D/g, '');
    
    // Verifica se tem pelo menos 10 dígitos (DDD + número)
    const isValid = cleanedPhone.length >= 10;
    setPhoneValid(isValid);
    return isValid;
  };

  const selectSampleAudio = (url: string) => {
    setAudioUrl(url);
    
    // Atualiza o snippet TwiML
    setTwimlSnippet(`<Response>\n  <Play>${url}</Play>\n</Response>`);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast.success("Copiado para a área de transferência");
      },
      (err) => {
        toast.error("Falha ao copiar texto: " + err);
      }
    );
  };

  const updateTwimlWithUrl = () => {
    setTwimlSnippet(`<Response>\n  <Play>${audioUrl}</Play>\n</Response>`);
  };

  const makeTestCall = async () => {
    if (!validatePhone(phoneNumber)) {
      toast.error("Número de telefone inválido");
      return;
    }

    if (!twimlBinId) {
      toast.error("ID do TwiML Bin é obrigatório");
      return;
    }

    try {
      setIsLoading(true);
      
      // Formato limpo do número
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      
      // Faz uma chamada através da Edge Function
      const { data, error } = await supabase.functions.invoke('manual-twilio-call', {
        body: {
          phoneNumber: cleanPhone,
          twimlBinId: twimlBinId,
          description: "Teste com TwiML Bin manual"
        }
      });

      if (error) {
        console.error('Erro ao fazer chamada de teste:', error);
        toast.error(`Erro: ${error.message || 'Falha ao conectar'}`);
        return;
      }
      
      setTestResult(data);
      setActiveTab("result");
      toast.success("Chamada iniciada com sucesso!");
      
    } catch (err: any) {
      console.error('Erro inesperado:', err);
      toast.error(`Erro: ${err.message || 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="w-full max-w-3xl mx-auto"
    >
      <TabsList className="grid grid-cols-3 mb-6">
        <TabsTrigger value="setup">1. Configuração</TabsTrigger>
        <TabsTrigger value="twiml">2. TwiML</TabsTrigger>
        <TabsTrigger value="result">3. Teste de Chamada</TabsTrigger>
      </TabsList>
      
      <TabsContent value="setup">
        <Card>
          <CardHeader>
            <CardTitle>Configuração do Teste Manual</CardTitle>
            <CardDescription>
              Selecione um arquivo MP3 simples para testar com o Twilio
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Amostras de Áudio</Label>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_AUDIO_URLS.map((sample) => (
                  <Button
                    key={sample.name}
                    variant={audioUrl === sample.url ? "default" : "outline"}
                    type="button"
                    onClick={() => selectSampleAudio(sample.url)}
                    className="flex-1"
                  >
                    {sample.name}
                  </Button>
                ))}
              </div>
              
              <div className="mt-2">
                {SAMPLE_AUDIO_URLS.find(s => s.url === audioUrl)?.description && (
                  <p className="text-sm text-gray-500 mt-1">
                    {SAMPLE_AUDIO_URLS.find(s => s.url === audioUrl)?.description}
                  </p>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="audio-url">URL do Áudio</Label>
              <div className="flex items-center gap-2">
                <Input 
                  id="audio-url" 
                  placeholder="URL do arquivo MP3 de teste" 
                  value={audioUrl}
                  onChange={(e) => setAudioUrl(e.target.value)}
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => copyToClipboard(audioUrl)}
                  title="Copiar URL"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Esta URL deve ser acessível publicamente para o Twilio conseguir acessá-la
              </p>
            </div>
          
            <Alert className="mt-4 bg-amber-50">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Passos para teste manual</AlertTitle>
              <AlertDescription>
                <ol className="list-decimal pl-5 mt-2 text-sm space-y-1.5">
                  <li>Copie a URL do áudio acima</li>
                  <li>Acesse o <a href="https://www.twilio.com/console/twiml-bins" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline flex items-center gap-1">Twilio TwiML Bins <ExternalLink className="h-3 w-3" /></a></li>
                  <li>Clique em "+" para criar um novo TwiML Bin</li>
                  <li>Dê um nome descritivo como "Teste MP3 Simples"</li>
                  <li>Cole o TwiML que será gerado na próxima aba</li>
                  <li>Salve o TwiML Bin e copie seu ID para uso na etapa de teste</li>
                </ol>
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => {
                updateTwimlWithUrl();
                setActiveTab("twiml");
              }} 
              className="w-full"
              disabled={!audioUrl}
            >
              Próximo: Gerar TwiML
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
      
      <TabsContent value="twiml">
        <Card>
          <CardHeader>
            <CardTitle>Configurar TwiML</CardTitle>
            <CardDescription>
              Use este código TwiML para criar um TwiML Bin no console do Twilio
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="twiml-code">Código TwiML</Label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => copyToClipboard(twimlSnippet)}
                  className="text-xs flex items-center gap-1 h-7"
                >
                  <Copy className="h-3 w-3" /> Copiar
                </Button>
              </div>
              <Textarea
                id="twiml-code"
                value={twimlSnippet}
                onChange={(e) => setTwimlSnippet(e.target.value)}
                className="font-mono h-32 resize-none"
              />
              <p className="text-xs text-gray-500">
                Cole este código no TwiML Bin do console Twilio.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="twiml-bin-id">ID do TwiML Bin</Label>
              <Input 
                id="twiml-bin-id" 
                placeholder="Ex: TW12345678901234567890123456789012" 
                value={twimlBinId}
                onChange={(e) => setTwimlBinId(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Após criar o TwiML Bin, copie seu ID da URL do Twilio Console (formato: TW seguido por 32 caracteres)
              </p>
            </div>
            
            <Alert className="mt-4 bg-blue-50">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Como encontrar o ID do TwiML Bin</AlertTitle>
              <AlertDescription>
                <p className="text-sm mt-1">
                  O ID do TwiML Bin está na URL do console do Twilio quando você visualiza o Bin, 
                  ou pode ser visto na lista de TwiML Bins. É um código que começa com "TW" e 
                  tem 34 caracteres no total.
                </p>
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => setActiveTab("result")} 
              className="w-full"
              disabled={!twimlBinId.trim().startsWith("TW")}
            >
              Próximo: Testar Chamada
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
      
      <TabsContent value="result">
        <Card>
          <CardHeader>
            <CardTitle>Teste de Chamada</CardTitle>
            <CardDescription>
              Realize uma chamada de teste usando o TwiML Bin configurado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className={!phoneValid ? "text-red-500" : ""}>
                Número de Telefone {!phoneValid && "(Formato inválido)"}
              </Label>
              <Input 
                id="phone" 
                placeholder="Digite o número de telefone (ex: 11976543210)" 
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  validatePhone(e.target.value);
                }}
                className={!phoneValid ? "border-red-500" : ""}
              />
              {!phoneValid && (
                <p className="text-xs text-red-500 mt-1">
                  Digite um número válido com DDD + número (mín. 10 dígitos)
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>Detalhes da Chamada</Label>
              <div className="text-sm bg-gray-50 p-3 rounded-md border border-gray-200">
                <p><strong>TwiML Bin ID:</strong> {twimlBinId || "Não definido"}</p>
                <p><strong>Áudio URL:</strong> {audioUrl || "Não definido"}</p>
              </div>
            </div>
            
            {testResult && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertTitle>Chamada Iniciada</AlertTitle>
                <AlertDescription>
                  <div className="text-sm mt-2">
                    <p><strong>Status:</strong> {testResult.status}</p>
                    <p><strong>Call SID:</strong> {testResult.callSid}</p>
                    <p className="text-xs mt-2 text-gray-500">
                      Verifique o resultado da chamada no console do Twilio ou aguarde o retorno da chamada.
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              onClick={makeTestCall} 
              disabled={isLoading || !phoneNumber || !twimlBinId || !phoneValid}
              className="w-full flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Iniciando chamada...
                </>
              ) : (
                <>
                  <Phone className="h-4 w-4" />
                  Fazer Chamada de Teste
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
