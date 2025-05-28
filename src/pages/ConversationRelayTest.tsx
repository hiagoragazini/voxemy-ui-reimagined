
import { Layout } from '@/components/dashboard/Layout';
import { ConversationRelayTester } from '@/components/test/ConversationRelayTester';
import { WebSocketServerManager } from '@/components/websocket/WebSocketServerManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ConversationRelayTestPage() {
  return (
    <Layout>
      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-2">ConversationRelay - Infraestrutura Corrigida</h1>
        <p className="mb-6 text-gray-600">
          Sistema de chamadas com IA usando protocolo ConversationRelay do Twilio e servidor WebSocket dedicado.
        </p>
        
        <Tabs defaultValue="server-setup" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="server-setup">Configuração do Servidor</TabsTrigger>
            <TabsTrigger value="call-test">Teste de Chamadas</TabsTrigger>
          </TabsList>

          <TabsContent value="server-setup" className="space-y-6">
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
              <h2 className="text-lg font-medium text-blue-800 mb-2">Problema Identificado e Solução</h2>
              <p className="text-sm text-blue-700 mb-3">
                O Supabase Edge Functions não suporta WebSockets persistentes adequadamente, 
                causando erro 502 (Bad Gateway) nas conexões do Twilio ConversationRelay.
              </p>
              <p className="text-sm text-blue-700 font-medium">
                ✅ Solução: Servidor WebSocket dedicado em Node.js implantado em Railway/Render
              </p>
            </div>

            <WebSocketServerManager />
          </TabsContent>

          <TabsContent value="call-test" className="space-y-6">
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg">
              <h2 className="text-lg font-medium text-amber-800 mb-2">Pré-requisitos para Teste</h2>
              <ol className="list-decimal text-sm text-amber-700 space-y-1 pl-5">
                <li>Configure o servidor WebSocket dedicado na aba "Configuração do Servidor"</li>
                <li>Teste a conectividade WebSocket antes de realizar chamadas</li>
                <li>Configure as variáveis de ambiente no Supabase:
                  <code className="ml-1 bg-amber-100 px-1 rounded">EXTERNAL_WEBSOCKET_URL</code>
                </li>
                <li>Desmarque "Modo de teste" para chamadas reais</li>
              </ol>
            </div>

            <ConversationRelayTester />
          </TabsContent>
        </Tabs>
        
        <div className="mt-8 p-5 bg-green-50 border border-green-100 rounded-lg">
          <h2 className="text-lg font-medium text-green-800 mb-3">Status da Implementação</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-medium text-green-700 mb-2">✅ Protocolo ConversationRelay</h3>
              <ul className="text-green-600 space-y-1 list-disc pl-5">
                <li>Handshake correto implementado</li>
                <li>Eventos: connected, start, media, transcript, mark, stop</li>
                <li>Formato áudio ulaw_8000 (telefônico)</li>
                <li>Heartbeat para conexão estável</li>
                <li>Logs detalhados para diagnóstico</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-green-700 mb-2">🔧 Infraestrutura WebSocket</h3>
              <ul className="text-green-600 space-y-1 list-disc pl-5">
                <li>Servidor Node.js dedicado</li>
                <li>Suporte nativo a WebSockets</li>
                <li>Deploy em Railway/Render</li>
                <li>Fallback automático configurado</li>
                <li>Variável EXTERNAL_WEBSOCKET_URL</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
