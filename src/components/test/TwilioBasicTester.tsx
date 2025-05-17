
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Phone, Bug } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';

export function TwilioBasicTester() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [customTwiml, setCustomTwiml] = useState(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Camila" language="pt-BR">Esta é uma mensagem de teste. Por favor, diga algo após o bipe.</Say>
  <Gather input="speech" language="pt-BR" action="https://nklbbeavnbwvvatqimxw.supabase.co/functions/v1/twilio-echo" method="POST" timeout="5">
    <Say voice="Polly.Camila" language="pt-BR">Por favor, fale agora.</Say>
  </Gather>
</Response>`);

  const handleBasicCall = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Por favor, digite um número de telefone válido');
      return;
    }

    setIsLoading(true);
    setResponse(null);

    try {
      // Clean the phone number to contain only digits
      const cleanedPhone = phoneNumber.replace(/\D/g, '');
      
      // Validate the phone number format
      const phoneRegex = /^\d{10,11}$/;
      if (!phoneRegex.test(cleanedPhone)) {
        toast.error("Número de telefone inválido. Use apenas números, incluindo DDD (ex: 11999887766)");
        setIsLoading(false);
        return;
      }
      
      console.log('Iniciando teste básico de diagnóstico Twilio para:', cleanedPhone);
      
      const { data, error } = await supabase.functions.invoke('twilio-diagnostic', {
        body: {
          phoneNumber: cleanedPhone,
          mode: 'basic'
        }
      });

      if (error) {
        console.error('Erro na função diagnóstica:', error);
        toast.error(`Erro: ${error.message || 'Falha ao conectar'}`);
        setResponse(JSON.stringify({error: error.message}, null, 2));
        return;
      }

      console.log('Resposta do teste básico:', data);
      setResponse(JSON.stringify(data, null, 2));
      toast.success('Chamada de teste iniciada! Verifique seu telefone.');
    } catch (err: any) {
      console.error('Erro inesperado:', err);
      toast.error(`Erro: ${err.message || 'Falha inesperada'}`);
      setResponse(JSON.stringify({error: err.message}, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomTwimlCall = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Por favor, digite um número de telefone válido');
      return;
    }

    if (!customTwiml.trim()) {
      toast.error('Por favor, forneça um TwiML válido');
      return;
    }

    setIsLoading(true);
    setResponse(null);

    try {
      // Clean the phone number to contain only digits
      const cleanedPhone = phoneNumber.replace(/\D/g, '');
      
      // Validate the phone number format
      const phoneRegex = /^\d{10,11}$/;
      if (!phoneRegex.test(cleanedPhone)) {
        toast.error("Número de telefone inválido. Use apenas números, incluindo DDD (ex: 11999887766)");
        setIsLoading(false);
        return;
      }
      
      console.log('Iniciando teste com TwiML personalizado para:', cleanedPhone);
      
      const { data, error } = await supabase.functions.invoke('twilio-diagnostic', {
        body: {
          phoneNumber: cleanedPhone,
          mode: 'custom',
          twiml: customTwiml
        }
      });

      if (error) {
        console.error('Erro na função diagnóstica com TwiML customizado:', error);
        toast.error(`Erro: ${error.message || 'Falha ao conectar'}`);
        setResponse(JSON.stringify({error: error.message}, null, 2));
        return;
      }

      console.log('Resposta do teste com TwiML customizado:', data);
      setResponse(JSON.stringify(data, null, 2));
      toast.success('Chamada com TwiML personalizado iniciada! Verifique seu telefone.');
    } catch (err: any) {
      console.error('Erro inesperado:', err);
      toast.error(`Erro: ${err.message || 'Falha inesperada'}`);
      setResponse(JSON.stringify({error: err.message}, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-2">Diagnosticador Twilio</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Esta ferramenta realiza testes básicos para diagnosticar problemas com integrações Twilio.
        </p>

        <div className="space-y-4">
          <div>
            <Label htmlFor="phone-number">Número de telefone</Label>
            <Input
              id="phone-number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Ex: 11999887766 (apenas números)"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Digite apenas números, incluindo DDD (ex: 11999887766)
            </p>
          </div>

          <Tabs defaultValue="basic">
            <TabsList className="mb-4">
              <TabsTrigger value="basic">Teste Básico</TabsTrigger>
              <TabsTrigger value="custom">TwiML Personalizado</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-md border text-sm">
                <p className="font-medium mb-2">Este teste usa um TwiML básico:</p>
                <pre className="bg-slate-100 p-2 rounded-md text-xs whitespace-pre-wrap overflow-auto max-h-40">
                  {`<Response>
  <Say voice="Polly.Camila" language="pt-BR">Esta é uma mensagem de teste. Por favor, diga algo após o bipe.</Say>
  <Gather input="speech" language="pt-BR" action="https://nklbbeavnbwvvatqimxw.supabase.co/functions/v1/twilio-echo" method="POST" timeout="5">
    <Say voice="Polly.Camila" language="pt-BR">Por favor, fale agora.</Say>
  </Gather>
</Response>`}
                </pre>
              </div>
              
              <Button
                onClick={handleBasicCall}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Phone className="mr-2 h-4 w-4" />
                )}
                Iniciar Teste Básico
              </Button>
            </TabsContent>
            
            <TabsContent value="custom" className="space-y-4">
              <div>
                <Label htmlFor="custom-twiml">TwiML Personalizado</Label>
                <Textarea
                  id="custom-twiml"
                  value={customTwiml}
                  onChange={(e) => setCustomTwiml(e.target.value)}
                  className="mt-1 font-mono text-xs h-60"
                />
              </div>
              
              <Button
                onClick={handleCustomTwimlCall}
                disabled={isLoading}
                className="w-full"
                variant="outline"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Bug className="mr-2 h-4 w-4" />
                )}
                Testar TwiML Personalizado
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {response && (
        <div className="mt-6 border rounded-md p-4 bg-gray-50">
          <h3 className="font-medium mb-2">Resposta:</h3>
          <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto max-h-60">
            {response}
          </pre>
        </div>
      )}
      
      <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-md">
        <h3 className="text-sm font-medium text-blue-700">Dicas de diagnóstico:</h3>
        <ul className="mt-2 text-sm text-blue-600 space-y-1 list-disc pl-5">
          <li>Verifique se o número segue o formato correto (incluindo código do país se necessário)</li>
          <li>Confirme que o webhook tem URL pública acessível</li>
          <li>Verifique se a resposta do webhook tem <code>Content-Type: text/xml</code></li>
          <li>Respostas para o Twilio não devem demorar mais de 5 segundos</li>
          <li>Confira os logs da função para detalhes de erros específicos</li>
        </ul>
      </div>
    </Card>
  );
}
