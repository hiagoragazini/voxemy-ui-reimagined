
import { AudioCallTester } from '@/components/test/AudioCallTester';
import { Layout } from '@/components/dashboard/Layout';

export default function AudioTesterPage() {
  return (
    <Layout>
      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-6">Teste de Áudio para Twilio</h1>
        <p className="mb-8 text-gray-600">
          Esta ferramenta permite testar arquivos MP3 simples com o Twilio para diagnosticar 
          problemas de compatibilidade. Se o arquivo MP3 simples funcionar, mas os arquivos 
          gerados pelo ElevenLabs não, então o problema está no formato do áudio.
        </p>
        
        <AudioCallTester />
        
        <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-medium mb-2">Instruções de diagnóstico:</h3>
          <ol className="list-decimal pl-5 space-y-2 text-sm">
            <li>Use um dos arquivos de áudio de exemplo ou forneça sua própria URL para um MP3 simples</li>
            <li>Faça uma chamada de teste para seu número</li>
            <li>Se você ouvir o áudio claramente, o problema está no formato específico dos arquivos ElevenLabs</li>
            <li>Se ocorrer o mesmo erro, o problema pode estar em outro aspecto da integração</li>
          </ol>
        </div>
      </div>
    </Layout>
  );
}
