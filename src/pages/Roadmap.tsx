
import React from 'react';
import { Layout } from "@/components/dashboard/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Roadmap() {
  return (
    <Layout>
      <div className="px-6 py-8 md:px-8 lg:px-12 xl:px-16">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col mb-10">
            <h1 className="text-4xl font-bold text-blue-700 mb-4">
              Roadmap do Produto
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">
              Estamos constantemente melhorando a Voxemy para oferecer mais 
              funcionalidades e uma melhor experiência. Confira abaixo o que 
              já está disponível e o que está por vir.
            </p>
          </div>
          
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-1 bg-gray-200 rounded-full"></div>
            
            <div className="space-y-12">
              {/* Item 1 - Agentes de Texto (Disponível) */}
              <div className="relative flex items-start">
                <div className="absolute left-6 w-5 h-5 bg-blue-600 border-4 border-white rounded-full shadow-sm"></div>
                <div className="ml-16">
                  <Card className="border-l-4 border-l-blue-600">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-0">
                          Disponível
                        </Badge>
                        <span className="text-sm text-gray-500 font-medium">Atual</span>
                      </div>
                      <h3 className="text-xl font-semibold mb-3 text-gray-900">
                        Agentes de Texto via WhatsApp
                      </h3>
                      <p className="text-gray-600 leading-relaxed mb-4">
                        Automatize seu atendimento via WhatsApp com agentes de IA.
                        Configure prompts personalizados, monitore conversas e 
                        melhore a experiência dos seus clientes.
                      </p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>✅ Criação e configuração de agentes</li>
                        <li>✅ Integração com WhatsApp Business API</li>
                        <li>✅ Monitoramento de conversas em tempo real</li>
                        <li>✅ Analytics e métricas de performance</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Item 2 - Agentes de Voz (Em Desenvolvimento) */}
              <div className="relative flex items-start">
                <div className="absolute left-6 w-5 h-5 bg-purple-600 border-4 border-white rounded-full shadow-sm"></div>
                <div className="ml-16">
                  <Card className="border-l-4 border-l-purple-600">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-0">
                          Em Desenvolvimento
                        </Badge>
                        <span className="text-sm text-gray-500 font-medium">Em Breve</span>
                      </div>
                      <h3 className="text-xl font-semibold mb-3 text-gray-900">
                        Agentes de Voz
                      </h3>
                      <p className="text-gray-600 leading-relaxed mb-4">
                        Automatize ligações telefônicas com agentes de IA que falam 
                        com voz natural. Configure prompts, monitore chamadas e 
                        ofereça uma experiência personalizada por telefone.
                      </p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>🔄 Sistema de voz natural com IA</li>
                        <li>🔄 Integração com sistemas telefônicos</li>
                        <li>🔄 Gravação e análise de chamadas</li>
                        <li>🔄 Métricas específicas para chamadas de voz</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Item 3 - Integrações com CRM (Planejado) */}
              <div className="relative flex items-start">
                <div className="absolute left-6 w-5 h-5 bg-gray-400 border-4 border-white rounded-full shadow-sm"></div>
                <div className="ml-16">
                  <Card className="border-l-4 border-l-gray-400 opacity-80">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-0">
                          Planejado
                        </Badge>
                        <span className="text-sm text-gray-500 font-medium">Futuro</span>
                      </div>
                      <h3 className="text-xl font-semibold mb-3 text-gray-900">
                        Integrações com CRM
                      </h3>
                      <p className="text-gray-600 leading-relaxed mb-4">
                        Conecte a Voxemy com seu CRM para sincronizar dados de clientes,
                        histórico de interações e métricas de atendimento automaticamente.
                      </p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>📋 Sincronização automática de contatos</li>
                        <li>📋 Histórico unificado de interações</li>
                        <li>📋 Integração com HubSpot, Salesforce, Pipedrive</li>
                        <li>📋 Webhooks personalizados</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Item 4 - Analytics Avançados (Planejado) */}
              <div className="relative flex items-start">
                <div className="absolute left-6 w-5 h-5 bg-gray-400 border-4 border-white rounded-full shadow-sm"></div>
                <div className="ml-16">
                  <Card className="border-l-4 border-l-gray-400 opacity-80">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-0">
                          Planejado
                        </Badge>
                        <span className="text-sm text-gray-500 font-medium">Futuro</span>
                      </div>
                      <h3 className="text-xl font-semibold mb-3 text-gray-900">
                        Analytics e IA Avançados
                      </h3>
                      <p className="text-gray-600 leading-relaxed mb-4">
                        Análises mais profundas com IA para otimizar o desempenho dos agentes
                        e identificar oportunidades de melhoria no atendimento.
                      </p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>📊 Análise de sentimento nas conversas</li>
                        <li>📊 Sugestões de melhoria baseadas em IA</li>
                        <li>📊 Relatórios personalizados avançados</li>
                        <li>📊 Previsões de performance</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>

          {/* Seção de informações adicionais */}
          <div className="mt-12 p-6 bg-blue-50 rounded-xl border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              🚀 Quer acompanhar nosso progresso?
            </h3>
            <p className="text-blue-800 mb-4">
              Estamos trabalhando constantemente para trazer novos recursos. 
              Entre em contato conosco se tiver sugestões ou dúvidas sobre o roadmap.
            </p>
            <div className="flex gap-3">
              <a 
                href="mailto:contato@voxemy.com" 
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Entrar em Contato
              </a>
              <a 
                href="/dashboard" 
                className="inline-flex items-center px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
              >
                Voltar ao Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
