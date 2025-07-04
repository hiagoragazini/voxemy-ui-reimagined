import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, ExternalLink, CheckCircle, AlertCircle, Server, Code } from "lucide-react";
import { toast } from "sonner";

export function RailwayDeployGuide() {
  const [railwayUrl, setRailwayUrl] = useState("");
  const [isDeploying, setIsDeploying] = useState(false);

  const copyToClipboard = (text: string, description: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${description} copiado para a área de transferência`);
  };

  const handleDeploy = () => {
    setIsDeploying(true);
    // Abrir Railway em uma nova aba
    window.open("https://railway.app/", "_blank");
    setTimeout(() => setIsDeploying(false), 3000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Deploy Railway - ConversationRelay com Vozes Nativas
          </CardTitle>
          <CardDescription>
            Sistema corrigido usando apenas vozes nativas do Twilio (ElevenLabs integrado) conforme orientação do suporte
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Passo 1: Código do servidor corrigido */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-50">Passo 1</Badge>
              <h3 className="font-medium">Servidor Railway Corrigido</h3>
            </div>
            
            <Alert>
              <Code className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p>Sistema corrigido para usar APENAS vozes nativas do ConversationRelay:</p>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => copyToClipboard(
                        `// Copie o conteúdo CORRIGIDO de src/templates/railway-websocket-server.js`,
                        "Caminho do servidor corrigido"
                      )}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      server.js (CORRIGIDO)
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => copyToClipboard(
                        `// Copie o conteúdo de src/templates/railway-package.json`,
                        "Caminho do package.json"
                      )}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      package.json
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          </div>

          {/* Passo 2: Variáveis de ambiente simplificadas */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50">Passo 2</Badge>
              <h3 className="font-medium">Variáveis de Ambiente (Simplificadas)</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              <div className="p-3 border rounded bg-gray-50">
                <div className="flex items-center justify-between">
                  <code className="text-sm">OPENAI_API_KEY</code>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => copyToClipboard("OPENAI_API_KEY", "Nome da variável")}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-xs text-gray-600 mt-1">Sua chave da API OpenAI</p>
              </div>
              
              <div className="p-3 border rounded bg-gray-50">
                <div className="flex items-center justify-between">
                  <code className="text-sm">SUPABASE_URL</code>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => copyToClipboard("https://nklbbeavnbwvvatqimxw.supabase.co", "URL do Supabase")}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-xs text-gray-600 mt-1">URL do seu projeto Supabase</p>
              </div>
              
              <div className="p-3 border rounded bg-gray-50">
                <div className="flex items-center justify-between">
                  <code className="text-sm">SUPABASE_SERVICE_KEY</code>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => copyToClipboard("SUPABASE_SERVICE_KEY", "Nome da variável")}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-xs text-gray-600 mt-1">Service Role Key do Supabase</p>
              </div>
            </div>
            
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                ✅ <strong>REMOVIDO:</strong> ELEVENLABS_API_KEY (não necessário - usamos vozes nativas)
              </AlertDescription>
            </Alert>
          </div>

          {/* Passo 3: Deploy */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-purple-50">Passo 3</Badge>
              <h3 className="font-medium">Deploy no Railway</h3>
            </div>
            
            <div className="space-y-3">
              <Button 
                onClick={handleDeploy}
                disabled={isDeploying}
                className="w-full"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                {isDeploying ? "Abrindo Railway..." : "Abrir Railway App"}
              </Button>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">Instruções no Railway:</p>
                    <ol className="list-decimal pl-4 space-y-1 text-sm">
                      <li>Crie um novo projeto</li>
                      <li>Conecte com GitHub ou faça upload direto</li>
                      <li>Cole os arquivos server.js e package.json</li>
                      <li>Configure as variáveis de ambiente</li>
                      <li>Faça o deploy</li>
                      <li>Copie a URL gerada (ex: https://seu-app.up.railway.app)</li>
                    </ol>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          </div>

          {/* Passo 4: Configurar URL */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-orange-50">Passo 4</Badge>
              <h3 className="font-medium">Configurar URL no Supabase</h3>
            </div>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="railway-url">URL do Railway (após deploy)</Label>
                <Input
                  id="railway-url"
                  value={railwayUrl}
                  onChange={(e) => setRailwayUrl(e.target.value)}
                  placeholder="https://seu-app.up.railway.app"
                />
              </div>
              
              {railwayUrl && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">Configure esta URL no Supabase:</p>
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          EXTERNAL_WEBSOCKET_URL = {railwayUrl}
                        </code>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => copyToClipboard(railwayUrl, "URL do Railway")}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          {/* Status do protocolo corrigido */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-medium text-green-800 mb-2">🎯 Sistema Corrigido - Vozes Nativas</h3>
            <div className="grid grid-cols-2 gap-4 text-sm text-green-700">
              <div>
                <h4 className="font-medium">✅ Correções Aplicadas:</h4>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Removido ElevenLabs API externa</li>
                  <li>Usando Polly.Camila-Neural nativa</li>
                  <li>Protocolo ConversationRelay simplificado</li>
                  <li>Eventos 'message' com voice nativo</li>
                  <li>Sem dependências externas de TTS</li>
                  <li>Conforme orientação Twilio Support</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium">🔧 Funcionalidades Mantidas:</h4>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Processamento de voz em tempo real</li>
                  <li>IA integrada (OpenAI)</li>
                  <li>Voz brasileira nativa de qualidade</li>
                  <li>Logs detalhados no Supabase</li>
                  <li>Heartbeat para estabilidade</li>
                  <li>Graceful shutdown</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-white border border-green-200 rounded">
              <h4 className="font-medium text-green-700 mb-2">🎤 Voz Configurada:</h4>
              <ul className="text-green-600 text-sm space-y-1 list-disc pl-5">
                <li><strong>Voice:</strong> Polly.Camila-Neural (Brasileira nativa)</li>
                <li><strong>Language:</strong> pt-BR</li>
                <li><strong>Sistema:</strong> ConversationRelay nativo (ElevenLabs integrado)</li>
                <li><strong>Qualidade:</strong> Máxima (sem perda de conversão)</li>
                <li><strong>Latência:</strong> Mínima (processamento nativo)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
