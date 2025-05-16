
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useVoiceCall } from '@/hooks/use-voice-call';
import { Loader2 } from 'lucide-react';

// URLs de exemplo de arquivos MP3 simples (tons telefônicos)
const SAMPLE_AUDIO_URLS = [
  {
    name: "Dial Tone",
    url: "https://www.soundjay.com/phone/sounds/dial-tone-1.mp3"
  },
  {
    name: "Busy Signal",
    url: "https://www.soundjay.com/phone/sounds/busy-signal-1.mp3"
  },
  {
    name: "Ringing Phone",
    url: "https://www.soundjay.com/phone/sounds/phone-ringing-1.mp3"
  }
];

export function AudioCallTester() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [description, setDescription] = useState('Teste com áudio MP3 simples');
  const { testCallWithSimpleAudio, isLoading } = useVoiceCall();

  const handleTest = async () => {
    if (!phoneNumber) {
      alert('Por favor, insira um número de telefone');
      return;
    }

    if (!audioUrl) {
      alert('Por favor, insira uma URL de áudio ou selecione uma amostra');
      return;
    }

    await testCallWithSimpleAudio({
      phoneNumber,
      testAudioUrl: audioUrl,
      description
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Testador de Áudio Simples</CardTitle>
        <CardDescription>
          Teste chamadas com arquivos MP3 simples para diagnosticar problemas de compatibilidade
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Número de Telefone</Label>
          <Input 
            id="phone" 
            placeholder="Digite o número de telefone (ex: 11976543210)" 
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="audio-url">URL do Áudio de Teste</Label>
          <Input 
            id="audio-url" 
            placeholder="URL do arquivo MP3 de teste" 
            value={audioUrl}
            onChange={(e) => setAudioUrl(e.target.value)}
          />
          <p className="text-sm text-gray-500">
            Digite a URL de um arquivo MP3 ou selecione uma das amostras abaixo
          </p>
        </div>

        <div className="space-y-2">
          <Label>Amostras de Áudio</Label>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_AUDIO_URLS.map((sample) => (
              <Button
                key={sample.name}
                variant="outline"
                type="button"
                onClick={() => setAudioUrl(sample.url)}
              >
                {sample.name}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descrição do Teste</Label>
          <Input 
            id="description" 
            placeholder="Descrição opcional do teste" 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleTest} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Iniciando chamada...
            </>
          ) : (
            'Testar Chamada com Áudio Simples'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
