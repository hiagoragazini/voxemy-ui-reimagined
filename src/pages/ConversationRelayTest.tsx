
import { Layout } from '@/components/dashboard/Layout';
import { ConversationRelayTester } from '@/components/test/ConversationRelayTester';

export default function ConversationRelayTestPage() {
  return (
    <Layout>
      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-2">Teste de ConversationRelay</h1>
        <p className="mb-4 text-gray-600">
          Esta página permite testar a funcionalidade Twilio ConversationRelay para conversas em
          tempo real por voz, com transcrição simultânea e processamento por IA.
        </p>
        
        <div className="mb-8 p-4 bg-blue-50 border border-blue-100 rounded-lg">
          <h2 className="text-lg font-medium text-blue-800 mb-2">Modo de Teste Ativado</h2>
          <p className="text-sm text-blue-700 mb-2">
            O modo de teste está ativado por padrão para permitir testes sem configuração do Twilio.
            Neste modo:
          </p>
          <ul className="list-disc text-sm text-blue-700 space-y-1 pl-5">
            <li>Nenhuma chamada real é realizada</li>
            <li>Um registro de chamada simulada é criado no banco de dados</li>
            <li>Você pode testar a interface sem credenciais do Twilio</li>
          </ul>
        </div>
        
        <ConversationRelayTester />
        
        <div className="mt-8 p-5 bg-amber-50 border border-amber-100 rounded-lg">
          <h2 className="text-lg font-medium text-amber-800 mb-3">Importante: Configuração Necessária</h2>
          <p className="text-sm text-amber-700 mb-3">
            Para utilizar chamadas reais (não no modo de teste), você precisa:
          </p>
          <ol className="list-decimal text-sm text-amber-700 space-y-2 pl-5">
            <li>Ter uma conta Twilio com acesso ao serviço ConversationRelay</li>
            <li>Configurar as seguintes variáveis de ambiente no Supabase:
              <ul className="list-disc pl-5 mt-1">
                <li><code>TWILIO_ACCOUNT_SID</code> - SID da sua conta Twilio</li>
                <li><code>TWILIO_AUTH_TOKEN</code> - Token de autenticação do Twilio</li>
                <li><code>TWILIO_PHONE_NUMBER</code> - Número de telefone Twilio habilitado para ConversationRelay</li>
                <li><code>WEBSOCKET_URL</code> - URL do servidor WebSocket para ConversationRelay (opcional)</li>
              </ul>
            </li>
            <li>Desmarcar a opção "Modo de teste" no formulário acima para fazer chamadas reais</li>
          </ol>
          <p className="mt-3 text-sm text-amber-700 font-medium">
            A falta de qualquer uma dessas configurações resultará em erros ou na ativação automática do modo de teste.
          </p>
        </div>
      </div>
    </Layout>
  );
}
