import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface MakeCallParams {
  phoneNumber: string;
  twimlInstructions?: string;
  agentId?: string;
  campaignId?: string;
  message?: string; // Manter para compatibilidade com código existente
  voiceId?: string;  // Added voiceId parameter to fix the type error
}

interface TextToSpeechParams {
  text: string;
  voiceId?: string;
  model?: string;
  stability?: number;
  similarity_boost?: number;
  style?: number;
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
  const textToSpeech = async ({ 
    text, 
    voiceId = "FGY2WhTYpPnrIDTdsKH5", // Laura - melhor para português
    model = "eleven_multilingual_v2",
    stability,
    similarity_boost,
    style 
  }: TextToSpeechParams) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Sending text for conversion:', text);
      console.log('Using voice ID:', voiceId || 'default');
      console.log('Using model:', model || 'default');
      
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { 
          text, 
          voiceId,
          model
        }
      });

      if (error) {
        console.error('Error in text-to-speech function:', error);
        throw new Error(error.message);
      }
      
      if (!data.success) {
        console.error('Text-to-speech function response:', data.error);
        throw new Error(data.error || 'Failed to generate audio');
      }

      console.log('Audio received successfully:', data.metadata ? JSON.stringify(data.metadata) : 'no metadata');
      
      // Store the audio content for playback later
      setLastAudioContent(data.audioContent);
      
      return data.audioContent; // Content of the audio in base64
    } catch (err: any) {
      console.error('Error converting text to voice:', err);
      setError(err.message);
      toast({
        variant: "destructive",
        title: "Error converting text to voice",
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
      console.log('Starting audio playback...');
      
      // If there's already an audio element, pause it
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }

      // Verify if the base64 is valid
      if (!base64Audio || base64Audio.trim() === '') {
        throw new Error('Invalid audio received');
      }
      
      // Create a new audio element to avoid cache issues
      const audio = new Audio();
      
      // Add event listeners before setting the source to avoid race conditions
      audio.onloadedmetadata = () => {
        console.log('Audio loaded:', audio.duration, 'seconds');
        // Force a layout reflow to ensure the browser recognizes the audio element
        document.body.appendChild(audio);
        document.body.removeChild(audio);
      };
      
      audio.onplay = () => {
        console.log('Playback started');
        setIsPlaying(true);
      };
      
      audio.onended = () => {
        console.log('Playback finished');
        setIsPlaying(false);
      };
      
      audio.onpause = () => {
        console.log('Playback paused');
        setIsPlaying(false);
      };
      
      // Set error event with details
      audio.onerror = (e) => {
        console.error('Error playing audio:', e);
        console.error('Error code:', audio.error ? audio.error.code : 'unknown');
        console.error('Error message:', audio.error ? audio.error.message : 'unknown');
        
        toast({
          variant: "destructive",
          title: "Error playing audio",
          description: audio.error?.message || 'Unknown error'
        });
        setIsPlaying(false);
      };

      // Set high volume to ensure it's not muted
      audio.volume = 1.0;
      
      // Force the audio to load synchronously
      audio.preload = "auto";
      
      // Set the audio source
      audio.src = `data:audio/mp3;base64,${base64Audio}`;
      
      // Store reference
      audioRef.current = audio;
      
      // Try 1: Use the Web Audio API
      console.log('Trying to play with Web Audio API...');
      try {
        // Create an audio context
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Decode base64 to array buffer
        const binaryString = atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Decode array buffer to audio
        audioContext.decodeAudioData(
          bytes.buffer,
          (buffer) => {
            console.log('Audio decoded successfully');
            // Create source node
            const source = audioContext.createBufferSource();
            source.buffer = buffer;
            
            // Connect to destination (speakers)
            source.connect(audioContext.destination);
            
            // Start playback
            source.start(0);
            setIsPlaying(true);
            
            // Define event for when playback ends
            source.onended = () => {
              console.log('Web Audio API playback finished');
              setIsPlaying(false);
            };
          },
          (err) => {
            console.error('Error decoding audio with Web Audio API:', err);
            console.log('Trying alternative method...');
            
            // Try 2: Use the HTML5 audio standard
            const playPromise = audio.play();
            
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  console.log('Playback started with HTML5 method');
                  setIsPlaying(true);
                  // Check if audio is progressing after 500ms
                  setTimeout(() => {
                    if (audio.currentTime > 0) {
                      console.log('Audio is progressing:', audio.currentTime);
                    } else {
                      console.log('Audio is not progressing');
                    }
                  }, 500);
                })
                .catch(err => {
                  console.error('Error starting playback (HTML5 method):', err);
                  setIsPlaying(false);
                  toast({
                    variant: "destructive", 
                    title: "Playback error",
                    description: 'Failed to play audio. Check if your browser allows automatic audio playback and if the volume is enabled.'
                  });
                });
            }
          }
        );
        
        return true;
      } catch (webAudioErr) {
        console.error('Failed to use Web Audio API:', webAudioErr);
        console.log('Trying HTML5 standard method...');
        
        // Try 2: Use the HTML5 audio standard
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('Playback started with HTML5 method');
              setIsPlaying(true);
            })
            .catch(err => {
              console.error('Error starting playback (HTML5 method):', err);
              setIsPlaying(false);
              toast({
                variant: "destructive",
                title: "Playback error",
                description: 'Failed to play audio. Check if your browser allows automatic audio playback and if the volume is enabled.'
              });
            });
        }
      }
      
      return true;
    } catch (err) {
      console.error('Failed to play audio:', err);
      setIsPlaying(false);
      toast({
        variant: "destructive",
        title: "Audio error",
        description: 'Failed to play audio. Check your audio settings.'
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
  const makeCall = async ({ phoneNumber, twimlInstructions, message, agentId, campaignId, voiceId }: MakeCallParams) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // URL to receive callbacks for call status
      const callbackUrl = `${window.location.origin}/api/call-status`;

      console.log('Starting call to:', phoneNumber);
      console.log('With agentId:', agentId);
      console.log('With campaignId:', campaignId);
      console.log('With twimlInstructions:', twimlInstructions ? 'provided' : 'not provided');
      console.log('With voiceId:', voiceId || 'not provided');
      
      const startTime = Date.now();
      
      // Add longer timeout for edge functions
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);
      
      // Invoke the function without the 'signal' property
      const { data, error } = await supabase.functions.invoke('make-call', {
        body: { 
          phoneNumber,
          callbackUrl,
          agentId,
          campaignId,
          twimlInstructions: twimlInstructions || message, // Usar twimlInstructions se fornecido, senão usar message
          voiceId, // Pass voiceId to the edge function
        }
      }).catch(err => {
        if (err.name === 'AbortError') {
          throw new Error('Timeout: Function took too long to respond');
        }
        throw err;
      });

      clearTimeout(timeoutId);
      
      const endTime = Date.now();
      console.log(`Response time for make-call function: ${endTime - startTime}ms`);

      if (error) {
        console.error('Error in make-call function:', error);
        throw new Error(error.message);
      }
      
      if (!data || !data.success) {
        console.error('make-call function response:', data);
        throw new Error(data?.error || 'Failed to start call');
      }

      toast({
        title: "Success!",
        description: "Call started successfully!",
      });
      return data;
    } catch (err: any) {
      console.error('Error making call:', err);
      setError(err.message);
      toast({
        variant: "destructive",
        title: "Error making call",
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
      // Add timeout for edge functions
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      // Invoke the function without the 'signal' property
      const { data, error } = await supabase.functions.invoke('make-call', {
        body: { test: true }
      }).catch(err => {
        if (err.name === 'AbortError') {
          throw new Error('Timeout: Function did not respond in time');
        }
        throw err;
      });
      
      clearTimeout(timeoutId);
      
      if (error) {
        throw new Error(`Error testing make-call function: ${error.message}`);
      }
      
      console.log("make-call function test result:", data);
      return data;
    } catch (err: any) {
      console.error('Error testing make-call function:', err);
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
