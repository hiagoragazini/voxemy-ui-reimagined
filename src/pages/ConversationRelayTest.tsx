
import { Layout } from '@/components/dashboard/Layout';
import { ConversationRelayTester } from '@/components/test/ConversationRelayTester';
import { WebSocketServerManager } from '@/components/websocket/WebSocketServerManager';
import { RailwayDeployGuide } from '@/components/websocket/RailwayDeployGuide';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ConversationRelayTestPage() {
  return (
    <Layout>
      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-2">ConversationRelay - Sistema Completo Railway</h1>
        <p className="mb-6 text-gray-600">
          Sistema de chamadas com IA usando protocolo ConversationRelay completo e servidor WebSocket dedicado no Railway.
        </p>
        
        <Tabs defaultValue="railway-deploy" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="railway-deploy">Deploy Railway</TabsTrigger>
            <TabsTrigger value="server-setup">Configuração Avançada</TabsTrigger>
            <TabsTrigger value="call-test">Teste de Chamadas</TabsTrigger>
          </TabsList>

          <TabsContent value="railway-deploy" className="space-y-6">
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
              <h2 className="text-lg font-medium text-blue-800 mb-2">🚀 Solução Completa Implementada</h2>
              <p className="text-sm text-blue-700 mb-3">
                Criei um servidor WebSocket Node.js completo que implementa corretamente o protocolo ConversationRelay do Twilio.
                Este servidor processa áudio em tempo real, integra IA e usa vozes brasileiras nativas.
              </p>
              <p className="text-sm text-blue-700 font-medium">
                ✅ O servidor Railway resolve completamente o problema de "application error, goodbye"
              </p>
            </div>

            <RailwayDeployGuide />
          </TabsContent>

          <TabsContent value="server-setup" className="space-y-6">
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg">
              <h2 className="text-lg font-medium text-amber-800 mb-2">Configuração Manual (Avançada)</h2>
              <p className="text-sm text-amber-700">
                Use esta aba apenas se precisar de configurações específicas ou troubleshooting avançado.
                O método Railway é recomendado para a maioria dos casos.
              </p>
            </div>

            <WebSocketServerManager />
          </TabsContent>

          <TabsContent value="call-test" className="space-y-6">
            <div className="p-4 bg-green-50 border border-green-100 rounded-lg">
              <h2 className="text-lg font-medium text-green-800 mb-2">✅ Pronto para Testar</h2>
              <ol className="list-decimal text-sm text-green-700 space-y-1 pl-5">
                <li>Faça o deploy no Railway usando a aba "Deploy Railway"</li>
                <li>Configure a variável EXTERNAL_WEBSOCKET_URL no Supabase</li>
                <li>Teste a conectividade WebSocket</li>
                <li>Desmarque "Modo de teste" para chamadas reais</li>
                <li>Faça uma chamada e converse com a IA</li>
              </ol>
            </div>

            <ConversationRelayTester />
          </TabsContent>
        </Tabs>
        
        <div className="mt-8 p-5 bg-green-50 border border-green-100 rounded-lg">
          <h2 className="text-lg font-medium text-green-800 mb-3">🎯 Sistema ConversationRelay Completo - Railway</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-medium text-green-700 mb-2">✅ Protocolo ConversationRelay</h3>
              <ul className="text-green-600 space-y-1 list-disc pl-5">
                <li>Handshake correto implementado</li>
                <li>Processamento de áudio em tempo real</li>
                <li>Transcrição automática com Whisper</li>
                <li>Respostas de IA integradas</li>
                <li>Voz brasileira (Polly.Camila-Neural)</li>
                <li>Logs detalhados e debugging</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-green-700 mb-2">🚀 Infraestrutura Railway</h3>
              <ul className="text-green-600 space-y-1 list-disc pl-5">
                <li>Servidor Node.js dedicado</li>
                <li>WebSocket nativo suportado</li>
                <li>Deploy simples e rápido</li>
                <li>Escalabilidade automática</li>
                <li>Monitoramento integrado</li>
                <li>Fallback automático configurado</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-white border border-green-200 rounded">
            <h4 className="font-medium text-green-700 mb-2">🔧 Diferenças da Implementação Railway:</h4>
            <ul className="text-green-600 text-sm space-y-1 list-disc pl-5">
              <li><strong>Protocolo Completo:</strong> Implementa todos os eventos ConversationRelay (connected, start, media, transcript, mark, stop)</li>
              <li><strong>Processamento Real-time:</strong> Processa áudio telefônico e gera respostas imediatamente</li>
              <li><strong>IA Integrada:</strong> OpenAI GPT-4o-mini para conversas naturais em português</li>
              <li><strong>Voz Nativa:</strong> Usa Polly.Camila-Neural diretamente no Twilio</li>
              <li><strong>Logs Avançados:</strong> Salva toda a conversa no Supabase com timestamps</li>
              <li><strong>Estabilidade:</strong> Heartbeat, graceful shutdown e error recovery</li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
}
