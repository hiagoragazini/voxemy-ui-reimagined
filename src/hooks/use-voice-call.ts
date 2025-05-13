
import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface MakeCallParams {
  phoneNumber: string;
  message?: string;
  agentId?: string;
  campaignId?: string;
}

interface TextToSpeechParams {
  text: string;
  voiceId?: string;
  model?: string;
}

export function useVoiceCall() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [lastAudioContent, setLastAudioContent] = useState<string | null>(null);

  // Limpar referências quando o componente é desmontado
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, []);

  // Função para converter texto em áudio usando Eleven Labs
  const textToSpeech = async ({ text, voiceId, model }: TextToSpeechParams) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Enviando texto para conversão:', text);
      console.log('Usando voice ID:', voiceId || 'padrão');
      console.log('Usando model:', model || 'padrão');
      
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { 
          text, 
          voiceId,
          model
        }
      });

      if (error) {
        console.error('Erro na função text-to-speech:', error);
        throw new Error(error.message);
      }
      
      if (!data.success) {
        console.error('Falha na resposta text-to-speech:', data.error);
        throw new Error(data.error || 'Falha ao gerar áudio');
      }

      console.log('Áudio recebido com sucesso:', data.metadata ? JSON.stringify(data.metadata) : 'sem metadados');
      
      // Armazenar o conteúdo do áudio para reprodução posterior
      setLastAudioContent(data.audioContent);
      
      return data.audioContent; // Conteúdo do áudio em base64
    } catch (err: any) {
      console.error('Erro na conversão de texto para voz:', err);
      setError(err.message);
      toast({
        variant: "destructive",
        title: "Erro ao converter texto para voz",
        description: err.message
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Função para reproduzir áudio base64 com melhor gerenciamento de erro
  const playAudio = (base64Audio: string) => {
    try {
      console.log('Iniciando reprodução de áudio...');
      
      // Se já existir um elemento de áudio, pare-o
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }

      // Verificar se o base64 está correto
      if (!base64Audio || base64Audio.trim() === '') {
        throw new Error('Áudio inválido recebido');
      }
      
      // Criar novo elemento de áudio para evitar problemas de cache
      const audio = new Audio();
      
      // Adicionar event listeners antes de definir a fonte para evitar race conditions
      audio.onloadedmetadata = () => {
        console.log('Áudio carregado:', audio.duration, 'segundos');
        // Forçar um layout reflow para garantir que o navegador reconheça o elemento de áudio
        document.body.appendChild(audio);
        document.body.removeChild(audio);
      };
      
      audio.onplay = () => {
        console.log('Reprodução iniciada');
        setIsPlaying(true);
      };
      
      audio.onended = () => {
        console.log('Reprodução finalizada');
        setIsPlaying(false);
      };
      
      audio.onpause = () => {
        console.log('Reprodução pausada');
        setIsPlaying(false);
      };
      
      // Configurar evento de erro com detalhes
      audio.onerror = (e) => {
        console.error('Erro ao reproduzir áudio:', e);
        console.error('Código do erro:', audio.error ? audio.error.code : 'desconhecido');
        console.error('Mensagem do erro:', audio.error ? audio.error.message : 'desconhecido');
        
        toast({
          variant: "destructive",
          title: "Erro ao reproduzir áudio",
          description: audio.error?.message || 'Erro desconhecido'
        });
        setIsPlaying(false);
      };

      // Definir volume alto para garantir que não esteja mudo
      audio.volume = 1.0;
      
      // Forçar o carregamento do áudio de forma síncrona
      audio.preload = "auto";
      
      // Definir a fonte do áudio
      audio.src = `data:audio/mp3;base64,${base64Audio}`;
      
      // Armazenar referência
      audioRef.current = audio;
      
      // Tentativa 1: Usar a API de áudio Web
      console.log('Tentando reproduzir com API Web Audio...');
      try {
        // Criar contexto de áudio
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Decodificar base64 para array buffer
        const binaryString = atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Decodificar array buffer para áudio
        audioContext.decodeAudioData(
          bytes.buffer,
          (buffer) => {
            console.log('Áudio decodificado com sucesso');
            // Criar source node
            const source = audioContext.createBufferSource();
            source.buffer = buffer;
            
            // Conectar ao destino (alto-falantes)
            source.connect(audioContext.destination);
            
            // Iniciar reprodução
            source.start(0);
            setIsPlaying(true);
            
            // Definir evento para quando a reprodução terminar
            source.onended = () => {
              console.log('Reprodução Web Audio finalizada');
              setIsPlaying(false);
            };
          },
          (err) => {
            console.error('Erro ao decodificar áudio com Web Audio API:', err);
            console.log('Tentando método alternativo...');
            
            // Tentativa 2: Usar a API de áudio HTML5 padrão
            const playPromise = audio.play();
            
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  console.log('Reprodução iniciada com sucesso (método HTML5)');
                  setIsPlaying(true);
                  // Verificar se há áudio sendo reproduzido após 500ms
                  setTimeout(() => {
                    if (audio.currentTime > 0) {
                      console.log('Áudio está progredindo:', audio.currentTime);
                    } else {
                      console.log('Áudio não está progredindo');
                    }
                  }, 500);
                })
                .catch(err => {
                  console.error('Erro ao iniciar reprodução (método HTML5):', err);
                  setIsPlaying(false);
                  toast({
                    variant: "destructive", 
                    title: "Erro de reprodução",
                    description: 'Não foi possível reproduzir o áudio. Verifique se seu navegador permite reprodução automática de som.'
                  });
                });
            }
          }
        );
        
        return true;
      } catch (webAudioErr) {
        console.error('Falha ao usar Web Audio API:', webAudioErr);
        console.log('Tentando método HTML5 padrão...');
        
        // Tentativa 2: Usar a API de áudio HTML5 padrão
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('Reprodução iniciada com sucesso (método HTML5)');
              setIsPlaying(true);
            })
            .catch(err => {
              console.error('Erro ao iniciar reprodução (método HTML5):', err);
              setIsPlaying(false);
              toast({
                variant: "destructive",
                title: "Erro de reprodução",
                description: 'Não foi possível reproduzir o áudio. Verifique se seu navegador permite reprodução automática de som e se o volume está ativado.'
              });
            });
        }
      }
      
      return true;
    } catch (err) {
      console.error('Falha ao reproduzir áudio:', err);
      setIsPlaying(false);
      toast({
        variant: "destructive",
        title: "Erro de áudio",
        description: 'Erro ao reproduzir áudio. Verifique as configurações de áudio do seu navegador.'
      });
      return false;
    }
  };

  // Reproduzir o último áudio novamente
  const playLastAudio = () => {
    if (lastAudioContent) {
      return playAudio(lastAudioContent);
    }
    return false;
  };

  // Função para fazer uma chamada usando Twilio
  const makeCall = async ({ phoneNumber, message, agentId, campaignId }: MakeCallParams) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // URL para receber callbacks de status de chamada
      const callbackUrl = `${window.location.origin}/api/call-status`;

      console.log('Iniciando chamada para:', phoneNumber);
      console.log('Com agentId:', agentId);
      console.log('Com campaignId:', campaignId);
      
      const startTime = Date.now();
      
      // Adicionar timeout maior para funções edge
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);
      
      // Remove the 'signal' property since it's not supported in FunctionInvokeOptions
      const { data, error } = await supabase.functions.invoke('make-call', {
        body: { 
          phoneNumber,
          callbackUrl,
          agentId,
          campaignId,
          twimlInstructions: message ? `
            <Response>
              <Say language="pt-BR">${message}</Say>
            </Response>
          ` : undefined,
        }
      }).catch(err => {
        if (err.name === 'AbortError') {
          throw new Error('Timeout: A função demorou muito para responder');
        }
        throw err;
      });

      clearTimeout(timeoutId);
      
      const endTime = Date.now();
      console.log(`Tempo de resposta da função make-call: ${endTime - startTime}ms`);

      if (error) {
        console.error('Erro na função make-call:', error);
        throw new Error(error.message);
      }
      
      if (!data || !data.success) {
        console.error('Resposta da função make-call:', data);
        throw new Error(data?.error || 'Falha ao iniciar chamada');
      }

      toast({
        title: "Sucesso!",
        description: "Chamada iniciada com sucesso!",
      });
      return data;
    } catch (err: any) {
      console.error('Erro ao fazer chamada:', err);
      setError(err.message);
      toast({
        variant: "destructive",
        title: "Erro ao fazer chamada",
        description: err.message
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Função para testar se a função make-call está acessível
  const testMakeCallFunction = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Adicionar timeout para funções edge
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      // Remove the 'signal' property since it's not supported in FunctionInvokeOptions
      const { data, error } = await supabase.functions.invoke('make-call', {
        body: { test: true }
      }).catch(err => {
        if (err.name === 'AbortError') {
          throw new Error('Timeout: A função não respondeu em tempo hábil');
        }
        throw err;
      });
      
      clearTimeout(timeoutId);
      
      if (error) {
        throw new Error(`Erro ao testar função make-call: ${error.message}`);
      }
      
      console.log("Resultado do teste da função make-call:", data);
      return data;
    } catch (err: any) {
      console.error('Erro ao testar função make-call:', err);
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    isPlaying,
    error,
    textToSpeech,
    playAudio,
    playLastAudio,
    makeCall,
    testMakeCallFunction
  };
}
