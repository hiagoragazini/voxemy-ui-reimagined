
import { Layout } from '@/components/dashboard/Layout';
import { ConversationRelayTester } from '@/components/test/ConversationRelayTester';
import { WebSocketServerManager } from '@/components/websocket/WebSocketServerManager';
import { RailwayDeployGuide } from '@/components/websocket/RailwayDeployGuide';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ConversationRelayTestPage() {
  return (
    <Layout>
      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-2">ConversationRelay - Sistema VOZES NATIVAS</h1>
        <p className="mb-6 text-gray-600">
          Sistema corrigido usando apenas vozes nativas do ConversationRelay (ElevenLabs integrado) conforme orientação do suporte Twilio.
        </p>
        
        <Tabs defaultValue="railway-deploy" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="railway-deploy">Deploy CORRIGIDO</TabsTrigger>
            <TabsTrigger value="server-setup">Configuração Simplificada</TabsTrigger>
            <TabsTrigger value="call-test">Teste NATIVO</TabsTrigger>
          </TabsList>

          <TabsContent value="railway-deploy" className="space-y-6">
            <div className="p-4 bg-green-50 border border-green-100 rounded-lg">
              <h2 className="text-lg font-medium text-green-800 mb-2">🎯 Sistema CORRIGIDO - Vozes Nativas</h2>
              <p className="text-sm text-green-700 mb-3">
                <strong>Correção implementada:</strong> Removido ElevenLabs API externa e configurado para usar apenas vozes nativas do ConversationRelay 
                (que já incluem ElevenLabs integrado) conforme orientação do suporte Twilio (Carolina E.).
              </p>
              <ul className="text-sm text-green-700 space-y-1 list-disc pl-5">
                <li>✅ <strong>Voz:</strong> Polly.Camila-Neural (brasileira nativa)</li>
                <li>✅ <strong>Sistema:</strong> ConversationRelay puro</li>
                <li>✅ <strong>Qualidade:</strong> ElevenLabs via Twilio (sem perda)</li>
                <li>✅ <strong>Latência:</strong> Mínima (processamento nativo)</li>
                <li>✅ <strong>Compatibilidade:</strong> 100% especificação oficial</li>
              </ul>
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
          <h2 className="text-lg font-medium text-green-800 mb-3">🎯 Sistema ConversationRelay VOZES NATIVAS</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-medium text-green-700 mb-2">✅ Correções Implementadas</h3>
              <ul className="text-green-600 space-y-1 list-disc pl-5">
                <li>Removido ElevenLabs API externa</li>
                <li>Configurado Polly.Camila-Neural nativa</li>
                <li>Protocolo ConversationRelay puro</li>
                <li>Eventos 'message' com voice integrado</li>
                <li>Sem dependências externas de TTS</li>
                <li>Conforme orientação suporte Twilio</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-green-700 mb-2">🎤 Voz Nativa Configurada</h3>
              <ul className="text-green-600 space-y-1 list-disc pl-5">
                <li>Voice: Polly.Camila-Neural (brasileira)</li>
                <li>Language: pt-BR</li>
                <li>Sistema: ConversationRelay nativo</li>
                <li>Qualidade: ElevenLabs integrado</li>
                <li>Latência: Mínima (sem conversões)</li>
                <li>Compatibilidade: 100% Twilio oficial</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-white border border-green-200 rounded">
            <h4 className="font-medium text-green-700 mb-2">📞 Orientação Suporte Twilio:</h4>
            <p className="text-green-600 text-sm italic">
              "ConversationRelay também tem vozes ElevenLabs, recomendamos usar as vozes disponíveis lá. 
              Não é possível trazer seu próprio TTS. Temos as mesmas vozes do ElevenLabs, exceto vozes personalizadas/clonadas."
              <span className="block mt-1 font-medium">- Carolina E., Twilio Support</span>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
