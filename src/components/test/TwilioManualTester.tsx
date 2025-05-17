
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useVoiceCall } from '@/hooks/use-voice-call';

export function TwilioManualTester() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('Olá, esta é uma mensagem de teste do Twilio.');
  const [isLoading, setIsLoading] = useState(false);
  const [twilioResponse, setTwilioResponse] = useState<string | null>(null);
  
  const { makeCall } = useVoiceCall();

  const handleDirectApiCall = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Por favor, digite um número de telefone válido');
      return;
    }

    setIsLoading(true);
    setTwilioResponse(null);

    try {
      // Faz uma chamada direta para a edge function tts-twillio-handler para debug
      const { data, error } = await supabase.functions.invoke('tts-twillio-handler', {
        body: {
          text: message, // Usando 'text' diretamente
          phoneNumber: phoneNumber.replace(/\D/g, ''),
          voiceId: '21m00Tcm4TlvDq8ikWAM' // Antônio (pt-BR)
        }
      });

      if (error) {
        console.error('Erro ao invocar edge function:', error);
        toast.error(`Erro: ${error.message}`);
        return;
      }

      console.log('Resposta da edge function:', data);
      setTwilioResponse(JSON.stringify(data, null, 2));
      toast.success('Edge function invocada com sucesso!');

    } catch (err: any) {
      console.error('Erro inesperado:', err);
      toast.error(`Erro inesperado: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMakeCall = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Por favor, digite um número de telefone válido');
      return;
    }

    setIsLoading(true);
    setTwilioResponse(null);

    try {
      const result = await makeCall({
        agentId: 'test-agent-id', // ID fictício para teste
        phoneNumber: phoneNumber.replace(/\D/g, ''),
        message: message,
        voiceId: '21m00Tcm4TlvDq8ikWAM' // Antônio (pt-BR)
      });

      if (result) {
        setTwilioResponse(JSON.stringify(result, null, 2));
        toast.success('Chamada iniciada com sucesso!');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg shadow">
      <div>
        <h2 className="text-lg font-medium mb-4">Teste Manual de Integração Twilio</h2>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone-number">Número de telefone</Label>
            <Input
              id="phone-number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Ex: 11999887766 (apenas números)"
              type="tel"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">Mensagem para enviar</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite a mensagem que será convertida em áudio"
              rows={3}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleDirectApiCall} 
              disabled={isLoading}
              className="flex-1"
              variant="outline"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Teste Direto API (debug)
            </Button>
            
            <Button 
              onClick={handleMakeCall} 
              disabled={isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Phone className="mr-2 h-4 w-4" />
              )}
              Iniciar Chamada de Teste
            </Button>
          </div>
        </div>
      </div>
      
      {twilioResponse && (
        <div className="mt-6 border rounded-md p-4 bg-gray-50">
          <h3 className="font-medium mb-2">Resposta do Twilio:</h3>
          <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
            {twilioResponse}
          </pre>
        </div>
      )}
      
      <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-md">
        <h3 className="text-sm font-medium text-blue-700">Dicas:</h3>
        <ul className="mt-2 text-sm text-blue-600 space-y-1 list-disc pl-5">
          <li>Certifique-se que as variáveis de ambiente ELEVENLABS_API_KEY, TWILIO_ACCOUNT_SID e TWILIO_AUTH_TOKEN estão configuradas no Supabase.</li>
          <li>O número de telefone deve ser digitado apenas com números (sem parenteses, traços ou espaços).</li>
          <li>Para testar com a voz em português, use o ID "21m00Tcm4TlvDq8ikWAM" (Antônio).</li>
        </ul>
      </div>
    </div>
  );
}
