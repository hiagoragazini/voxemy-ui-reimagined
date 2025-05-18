
import React from 'react';
import Layout from '@/components/dashboard/Layout';
import { VoicebotTester } from '@/components/test/VoicebotTester';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function VoicebotTest() {
  return (
    <Layout>
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Teste de Voicebot Full-Duplex</h1>
        
        <Tabs defaultValue="custom">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-3">
            <TabsTrigger value="custom">Voicebot Full-Duplex</TabsTrigger>
            <TabsTrigger value="architecture">Arquitetura</TabsTrigger>
            <TabsTrigger value="info">Informações Técnicas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="custom" className="mt-6">
            <VoicebotTester />
          </TabsContent>
          
          <TabsContent value="architecture" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Arquitetura do Voicebot Full-Duplex</CardTitle>
                <CardDescription>
                  Implementação baseada em SIP Trunk + Media Server próprio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">Componentes</h3>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>SIP Trunk: Conexão com operadora para realizar/receber chamadas</li>
                      <li>Media Server: FreeSWITCH/Asterisk para manipulação de áudio em tempo real</li>
                      <li>Pipeline de ASR: Transcrição contínua de áudio usando Whisper/Deepgram</li>
                      <li>Processamento LLM: Geração de respostas contextuais com OpenAI</li>
                      <li>TTS: Síntese de voz natural com ElevenLabs</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium">Vantagens</h3>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>Comunicação Full-Duplex: Permite conversação natural sem interrupção</li>
                      <li>Baixa Latência: &lt;2 segundos de delay entre fala e resposta</li>
                      <li>Controle Total: Independência de limitações de APIs de terceiros</li>
                      <li>Escalabilidade: Arquitetura projetada para alto volume de chamadas simultâneas</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="info" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Técnicas</CardTitle>
                <CardDescription>
                  Detalhes técnicos da implementação
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">Requisitos de Infraestrutura</h3>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>Servidor FreeSWITCH/Asterisk configurado</li>
                      <li>Conexão SIP Trunk com operadora homologada</li>
                      <li>Largura de banda adequada para chamadas simultâneas</li>
                      <li>Acesso às APIs: OpenAI, ElevenLabs, Deepgram/Whisper</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium">Otimizações Implementadas</h3>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>Buffers adaptativos para minimizar delay</li>
                      <li>Detecção avançada de atividade de voz</li>
                      <li>Processamento paralelo de áudio e texto</li>
                      <li>Codec OPUS para alta qualidade de áudio</li>
                      <li>SRTP para criptografia de mídia</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
