
import { Layout } from '@/components/dashboard/Layout';
import { TwilioManualTester } from '@/components/test/TwilioManualTester';

export default function TwilioManualTestPage() {
  return (
    <Layout>
      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-6">Teste Manual de Integração Twilio</h1>
        <p className="mb-8 text-gray-600">
          Esta ferramenta permite testar manualmente a integração com Twilio usando arquivos MP3 
          simples e TwiML Bin, para diagnosticar problemas de compatibilidade de formato de áudio.
        </p>
        
        <TwilioManualTester />
        
        <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-medium mb-2">Diagnóstico de Problemas de Áudio no Twilio:</h3>
          <ol className="list-decimal pl-5 space-y-2 text-sm">
            <li>Se o áudio MP3 simples for reproduzido corretamente na chamada, mas o áudio gerado pelo ElevenLabs não funcionar, o problema está no formato do áudio.</li>
            <li>Áudios para telefonia geralmente precisam estar em formato WAV 8kHz, mono e 16-bit para melhor compatibilidade.</li>
            <li>Considere implementar um serviço de conversão intermediário que converta o áudio do ElevenLabs para o formato telefônico adequado.</li>
            <li>O código de exemplo fornecido demonstra como criar esse serviço de conversão usando ffmpeg.</li>
          </ol>
          
          <div className="mt-4 bg-blue-50 p-3 rounded-md border border-blue-100">
            <h4 className="font-medium text-blue-800 mb-1 text-sm">Solução Recomendada:</h4>
            <p className="text-xs text-blue-700">
              Para resolver problemas de compatibilidade de áudio, considere implementar um serviço de conversão 
              que processe o áudio gerado pelo ElevenLabs e o converta para formato WAV otimizado para telefonia 
              (8kHz, mono, PCM 16-bit) antes de enviá-lo ao Twilio.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
