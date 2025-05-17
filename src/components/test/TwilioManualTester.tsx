
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Loader2, Phone, ExternalLink, CheckCircle2, AlertCircle, Copy, Volume2 } from 'lucide-react';
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
  const [audioConverting, setAudioConverting] = useState(false);
  const [conversionResult, setConversionResult] = useState<any>(null);
  const [audioTestPlaying, setAudioTestPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  
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

  const playAudioTest = () => {
    if (!audioUrl) return;
    
    // Parar qualquer áudio em reprodução
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }
    
    try {
      const audio = new Audio(audioUrl);
      setAudioElement(audio);
      setAudioTestPlaying(true);
      
      audio.play().catch(err => {
        console.error('Erro ao reproduzir áudio:', err);
        toast.error(`Erro ao reproduzir: ${err.message}`);
        setAudioTestPlaying(false);
      });
      
      audio.onended = () => {
        setAudioTestPlaying(false);
      };
    } catch (err: any) {
      toast.error(`Erro ao criar player: ${err.message}`);
    }
  };

  const stopAudioTest = () => {
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
      setAudioTestPlaying(false);
    }
  };

  const convertAudioForTwilio = async () => {
    if (!audioUrl) {
      toast.error("URL do áudio é obrigatória");
      return;
    }
    
    setAudioConverting(true);
    setConversionResult(null);
    
    try {
      // Simular a conversão - em um ambiente real, chamaríamos uma API para converter
      // o áudio para o formato compatível com telefonia (8kHz, mono, WAV)
      toast.info("Simulando conversão de áudio para formato telefônico");
      
      // Aguardar alguns segundos para simular o processo
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simular resultado de conversão
      const twilioCompatibleUrl = audioUrl; // Em um caso real, esta seria a URL do áudio convertido
      
      setConversionResult({
        success: true,
        originalUrl: audioUrl,
        convertedUrl: twilioCompatibleUrl,
        message: "Simulação de conversão concluída. Em um ambiente real, o áudio seria convertido para 8kHz, mono, WAV.",
        twiml: `<Response>\n  <Play>${twilioCompatibleUrl}</Play>\n</Response>`
      });
      
      // Atualizar o TwiML snippet
      setTwimlSnippet(`<Response>\n  <Play>${twilioCompatibleUrl}</Play>\n</Response>`);
      
      toast.success("Simulação de conversão concluída");
    } catch (err: any) {
      console.error('Erro na conversão:', err);
      toast.error(`Erro: ${err.message}`);
    } finally {
      setAudioConverting(false);
    }
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
      <TabsList className="grid grid-cols-4 mb-6">
        <TabsTrigger value="setup">1. Escolha do Áudio</TabsTrigger>
        <TabsTrigger value="convert">2. Compatibilidade</TabsTrigger>
        <TabsTrigger value="twiml">3. TwiML</TabsTrigger>
        <TabsTrigger value="result">4. Teste de Chamada</TabsTrigger>
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
                  disabled={!audioUrl}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={audioTestPlaying ? stopAudioTest : playAudioTest}
                  title={audioTestPlaying ? "Parar" : "Reproduzir"}
                  disabled={!audioUrl}
                >
                  {audioTestPlaying ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Esta URL deve ser acessível publicamente para o Twilio conseguir acessá-la
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => {
                updateTwimlWithUrl();
                setActiveTab("convert");
              }} 
              className="w-full"
              disabled={!audioUrl}
            >
              Próximo: Verificar Compatibilidade
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
      
      <TabsContent value="convert">
        <Card>
          <CardHeader>
            <CardTitle>Compatibilidade com Telefonia</CardTitle>
            <CardDescription>
              Verifique se o áudio é compatível com sistemas telefônicos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-amber-50">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Formato de áudio para telefonia</AlertTitle>
              <AlertDescription>
                <p className="text-sm mt-1">
                  O Twilio e outros sistemas telefônicos funcionam melhor com áudio no formato:
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>Taxa de amostragem: 8kHz</li>
                    <li>Canais: Mono (1 canal)</li>
                    <li>Formato: PCM 16-bit WAV ou MP3 de baixa bitrate</li>
                  </ul>
                </p>
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium">Áudio selecionado:</h3>
                  <p className="text-xs text-gray-500 mt-1 break-all">{audioUrl}</p>
                </div>
                
                {audioUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={audioTestPlaying ? stopAudioTest : playAudioTest}
                    className="flex items-center gap-1 h-8"
                  >
                    {audioTestPlaying ? "Parar" : "Testar"} Áudio
                    {audioTestPlaying ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Volume2 className="h-3 w-3" />
                    )}
                  </Button>
                )}
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h3 className="text-sm font-medium mb-2">Converter áudio para formato telefônico:</h3>
              <p className="text-xs text-gray-500 mb-4">
                Esta função simularia a conversão do áudio para um formato otimizado para telefonia.
                Em uma implementação real, o áudio seria convertido para WAV mono 8kHz.
              </p>
              
              <Button
                onClick={convertAudioForTwilio}
                disabled={audioConverting || !audioUrl}
                className="w-full"
              >
                {audioConverting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Convertendo áudio...
                  </>
                ) : (
                  "Simular Conversão para Formato Telefônico"
                )}
              </Button>
              
              {conversionResult && (
                <div className="mt-4 p-3 bg-green-50 rounded-md border border-green-100">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <p className="text-sm font-medium text-green-800">Conversão simulada com sucesso</p>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    {conversionResult.message}
                  </p>
                  <div className="mt-3 text-xs text-gray-500">
                    <p><strong>URL original:</strong> {conversionResult.originalUrl}</p>
                    <p className="mt-1"><strong>URL convertida (simulação):</strong> {conversionResult.convertedUrl}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => {
                setActiveTab("twiml");
              }} 
              className="w-full"
              disabled={!audioUrl}
            >
              Próximo: Configurar TwiML
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
                {conversionResult && (
                  <p className="text-xs text-green-600 mt-1">
                    <CheckCircle2 className="h-3 w-3 inline mr-1" />
                    Áudio simulado com conversão para formato telefônico
                  </p>
                )}
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
