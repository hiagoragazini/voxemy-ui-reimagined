
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VapiTextToSpeechParams {
  text: string;
  voiceId?: string;
}

interface VapiCallParams {
  agentId: string;
  campaignId?: string;
  phoneNumber: string;
  message: string;
  leadId?: string;
  voiceId?: string;
}

export function useVapiCall() {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [callDetails, setCallDetails] = useState<any>(null);
  const [audioContent, setAudioContent] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Text to Speech conversion using VAPI
  const textToSpeech = async ({ 
    text, 
    voiceId = "FGY2WhTYpPnrIDTdsKH5", // Laura - melhor para português
  }: VapiTextToSpeechParams) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Sending text for conversion:', text);
      console.log('Using voice ID:', voiceId);
      
      const { data, error } = await supabase.functions.invoke('vapi-text-to-speech', {
        body: { 
          text, 
          voiceId,
        }
      });

      if (error) {
        console.error('Error in vapi-text-to-speech function:', error);
        setError(error.message);
        throw new Error(error.message);
      }
      
      if (!data.success) {
        console.error('Failed response from vapi-text-to-speech:', data.error);
        setError(data.error || 'Failed to generate audio');
        throw new Error(data.error || 'Failed to generate audio');
      }

      console.log('Audio received successfully:', data.metadata);
      
      // Store audio content for playback
      setAudioContent(data.audioContent);
      
      return data.audioContent;
    } catch (err: any) {
      console.error('Error in text-to-speech conversion:', err);
      setError(err.message);
      toast.error('Error converting text to speech: ' + err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Make a call with VAPI
  const makeCall = async ({ 
    agentId, 
    campaignId, 
    phoneNumber, 
    message, 
    leadId,
    voiceId 
  }: VapiCallParams) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Clean the phone number
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      
      if (cleanPhone.length < 8 || cleanPhone.length > 15) {
        toast.error('Invalid phone number');
        return null;
      }

      if (!message.trim()) {
        toast.error('Message cannot be empty');
        return null;
      }

      console.log('Starting VAPI call:', {
        agentId,
        campaignId,
        phoneNumber: cleanPhone,
        message,
        leadId,
        voiceId
      });

      // Call the Edge Function to make the VAPI call
      const { data, error } = await supabase.functions.invoke('vapi-call-handler', {
        body: {
          agentId,
          campaignId,
          phoneNumber: cleanPhone,
          message,
          leadId,
          voiceId
        }
      });

      if (error) {
        console.error('Error making call:', error);
        setError(error.message);
        toast.error(`Call error: ${error.message || 'Failed to connect'}`);
        return null;
      }

      console.log('Call initiated successfully:', data);
      toast.success('Call initiated successfully!');
      setCallDetails(data);
      return data;

    } catch (err: any) {
      console.error('Unexpected error making call:', err);
      setError(err.message);
      toast.error(`Error: ${err.message || 'Unexpected failure'}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Terminate a call
  const terminateCall = async (callId: string) => {
    if (!callId) {
      toast.error('No call ID provided');
      return false;
    }

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.functions.invoke('voicebot-terminate', {
        body: { callId }
      });

      if (error) {
        console.error('Error terminating call:', error);
        toast.error(`Failed to terminate call: ${error.message}`);
        return false;
      }

      toast.success('Call terminated successfully');
      return true;
    } catch (err: any) {
      console.error('Error in terminate call:', err);
      toast.error(`Error: ${err.message || 'Failed to terminate call'}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Play audio from base64 string
  const playAudio = (base64Audio: string) => {
    if (!base64Audio) return false;
    
    try {
      // Stop any currently playing audio
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }
      
      // Create new audio element
      const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
      audio.volume = 1.0;
      
      // Store the audio element for potential stopping later
      setAudioElement(audio);
      setIsPlaying(true);
      
      // Play
      audio.play().catch(err => {
        console.error('Error playing audio:', err);
        setIsPlaying(false);
        toast.error('Error playing audio');
        return false;
      });
      
      // Setup onended event
      audio.onended = () => {
        setIsPlaying(false);
      };
      
      return true;
    } catch (err) {
      console.error('Error creating audio element:', err);
      setIsPlaying(false);
      toast.error('Error playing audio');
      return false;
    }
  };

  // Play the last generated audio
  const playLastAudio = () => {
    if (audioContent) {
      return playAudio(audioContent);
    }
    toast.error('No audio available to play');
    return false;
  };

  // Stop any currently playing audio
  const stopAudio = () => {
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
      setIsPlaying(false);
      return true;
    }
    return false;
  };

  return {
    textToSpeech,
    makeCall,
    terminateCall,
    playAudio,
    playLastAudio,
    stopAudio,
    isLoading,
    isPlaying,
    error,
    callDetails,
    audioContent
  };
}
