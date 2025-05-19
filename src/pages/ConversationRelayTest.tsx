
import { Layout } from '@/components/dashboard/Layout';
import { ConversationRelayTester } from '@/components/test/ConversationRelayTester';

export default function ConversationRelayTestPage() {
  return (
    <Layout>
      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-2">Teste de ConversationRelay</h1>
        <p className="mb-8 text-gray-600">
          Esta página permite testar a funcionalidade Twilio ConversationRelay para conversas em
          tempo real por voz, com transcrição simultânea e processamento por IA.
        </p>
        
        <ConversationRelayTester />
        
        <div className="mt-8 p-5 bg-amber-50 border border-amber-100 rounded-lg">
          <h2 className="text-lg font-medium text-amber-800 mb-3">Importante: Configuração Necessária</h2>
          <p className="text-sm text-amber-700 mb-3">
            Para que esta funcionalidade funcione corretamente, você precisa:
          </p>
          <ol className="list-decimal text-sm text-amber-700 space-y-2 pl-5">
            <li>Ter uma conta Twilio com acesso ao serviço ConversationRelay</li>
            <li>Configurar um servidor WebSocket para processar as mensagens em tempo real</li>
            <li>Ter as seguintes variáveis de ambiente configuradas:
              <ul className="list-disc pl-5 mt-1">
                <li>TWILIO_ACCOUNT_SID</li>
                <li>TWILIO_AUTH_TOKEN</li>
                <li>TWILIO_PHONE_NUMBER</li>
                <li>WEBSOCKET_URL (URL do servidor WebSocket para ConversationRelay)</li>
                <li>OPENAI_API_KEY (no servidor WebSocket)</li>
              </ul>
            </li>
          </ol>
        </div>
      </div>
    </Layout>
  );
}
