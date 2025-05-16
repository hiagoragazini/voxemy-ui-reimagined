
import { Layout } from '@/components/dashboard/Layout';
import { TwilioManualTester } from '@/components/test/TwilioManualTester';

export default function TwilioManualTestPage() {
  return (
    <Layout>
      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-6">Teste Manual de Integração Twilio</h1>
        <p className="mb-8 text-gray-600">
          Esta ferramenta permite testar manualmente a integração com Twilio usando arquivos MP3 
          simples e TwiML Bin, para diagnosticar problemas de compatibilidade de formato.
        </p>
        
        <TwilioManualTester />
        
        <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-medium mb-2">Instruções para teste manual:</h3>
          <ol className="list-decimal pl-5 space-y-2 text-sm">
            <li>Faça upload de um arquivo MP3 simples para o Twilio Assets</li>
            <li>Crie um TwiML Bin com a tag Play apontando para esse arquivo</li>
            <li>Use o ID do TwiML Bin para realizar uma chamada de teste</li>
            <li>Compare o resultado com chamadas feitas com áudio do ElevenLabs</li>
          </ol>
        </div>
      </div>
    </Layout>
  );
}
