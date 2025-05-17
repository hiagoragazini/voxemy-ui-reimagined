import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { useVoiceCall } from '@/hooks/use-voice-call';

export function TwilioManualTester() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('Olá, esta é uma mensagem de teste do Twilio.');
  const [isLoading, setIsLoading] = useState(false);
  const [twilioResponse, setTwilioResponse] = useState<string | null>(null);
  
  const { makeCall } = useVoiceCall();

  const handleMakeCall = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Por favor, digite um número de telefone válido');
      return;
    }

    setIsLoading(true);
    setTwilioResponse(null);

    try {
      // Limpa o número de telefone para conter apenas dígitos
      const cleanedPhone = phoneNumber.replace(/\D/g, '');
      
      console.log('Iniciando chamada com número limpo:', cleanedPhone);
      console.log('Mensagem a ser enviada:', message);
      
      const result = await makeCall({
        agentId: 'test-agent-id',
        phoneNumber: cleanedPhone,
        message: message,
        voiceId: '21m00Tcm4TlvDq8ikWAM' // Antônio (pt-BR)
      });

      if (result) {
        setTwilioResponse(JSON.stringify(result, null, 2));
        toast.success('Chamada iniciada com sucesso!');
      }
    } catch (err: any) {
      console.error('Erro na chamada:', err);
      toast.error(`Erro: ${err.message || 'Falha inesperada'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Keep only numbers
    const value = e.target.value.replace(/\D/g, '');
    setPhoneNumber(value);
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg shadow">
      <div>
        <h2 className="text-lg font-medium mb-4">Teste de Chamada Twilio</h2>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone-number">Número de telefone</Label>
            <Input
              id="phone-number"
              value={phoneNumber}
              onChange={handlePhoneChange}
              placeholder="Ex: 11999887766 (apenas números)"
              type="tel"
            />
            <p className="text-xs text-muted-foreground">
              Digite apenas números, incluindo DDD (ex: 11999887766)
            </p>
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

          <Button 
            onClick={handleMakeCall} 
            disabled={isLoading || !phoneNumber}
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
          <li>Certifique-se que as variáveis de ambiente ELEVENLABS_API_KEY, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN e TWILIO_PHONE_NUMBER estão configuradas no Supabase.</li>
          <li>O número de telefone deve ser digitado apenas com números (sem parenteses, traços ou espaços).</li>
          <li>Para testar com a voz em português, use o ID "21m00Tcm4TlvDq8ikWAM" (Antônio).</li>
          <li>Formato do número: DDD + número (ex: 11999887766).</li>
        </ul>
      </div>
    </div>
  );
}
