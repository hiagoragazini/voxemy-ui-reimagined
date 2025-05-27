
import { Layout } from '@/components/dashboard/Layout';
import { ConversationRelayTester } from '@/components/test/ConversationRelayTester';

export default function ConversationRelayTestPage() {
  return (
    <Layout>
      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-2">Teste de Vapi AI</h1>
        <p className="mb-4 text-gray-600">
          Esta página permite testar a funcionalidade Vapi AI para conversas em
          tempo real por voz, com transcrição simultânea e processamento por IA.
        </p>
        
        <div className="mb-8 p-4 bg-green-50 border border-green-100 rounded-lg">
          <h2 className="text-lg font-medium text-green-800 mb-2">Vapi AI Ativado</h2>
          <p className="text-sm text-green-700 mb-2">
            O sistema foi migrado para Vapi AI com melhorias significativas:
          </p>
          <ul className="list-disc text-sm text-green-700 space-y-1 pl-5">
            <li>Voz natural ElevenLabs em português brasileiro</li>
            <li>Transcrição mais precisa via OpenAI</li>
            <li>Conversas mais fluidas e naturais</li>
            <li>Integração simplificada sem WebSockets complexos</li>
            <li>Melhor qualidade de áudio para telefonia</li>
          </ul>
        </div>
        
        <ConversationRelayTester />
        
        <div className="mt-8 p-5 bg-blue-50 border border-blue-100 rounded-lg">
          <h2 className="text-lg font-medium text-blue-800 mb-3">Configuração Vapi AI</h2>
          <p className="text-sm text-blue-700 mb-3">
            Para utilizar chamadas reais com Vapi AI, configure:
          </p>
          <ol className="list-decimal text-sm text-blue-700 space-y-2 pl-5">
            <li>Configure a variável de ambiente no Supabase:
              <ul className="list-disc pl-5 mt-1">
                <li><code>VAPI_API_KEY</code> - Sua chave de API da Vapi</li>
              </ul>
            </li>
            <li>Configure um Assistant na plataforma Vapi com:
              <ul className="list-disc pl-5 mt-1">
                <li>Transcriber: OpenAI</li>
                <li>Voice: ElevenLabs (português brasileiro)</li>
                <li>Prompt personalizado para seu caso de uso</li>
              </ul>
            </li>
            <li>Importe seu número do Twilio para a Vapi (se necessário)</li>
            <li>Use o Assistant ID nos testes acima</li>
          </ol>
        </div>
      </div>
    </Layout>
  );
}
