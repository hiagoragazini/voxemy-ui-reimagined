
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, Play, StopCircle } from "lucide-react";
import { toast } from "sonner";
import { useVapiCall } from "@/hooks/use-vapi-call";
import { AudioPlayer } from "@/components/ui/AudioPlayer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";

interface CampaignCallTesterProps {
  campaignId?: string;
  agentId?: string;
  agentName?: string;
  agentVoiceId?: string; 
  phoneNumber?: string;
  leadName?: string;
  leadId?: string;
  onClose?: () => void;
  onCallComplete?: () => void;
}

export function CampaignCallTester({
  campaignId = '',
  agentId,
  agentName = "Agente",
  agentVoiceId,
  phoneNumber = '',
  leadName = 'Teste',
  leadId = '',
  onClose,
  onCallComplete
}: CampaignCallTesterProps) {
  const [testPhone, setTestPhone] = useState(phoneNumber);
  const [testName, setTestName] = useState(leadName);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(agentVoiceId || "");
  const [audioContent, setAudioContent] = useState<string | null>(null);
  const [phoneValid, setPhoneValid] = useState(true);
  const [testMessage, setTestMessage] = useState<string>("");
  
  const { makeCall, textToSpeech, playAudio, isLoading, stopAudio } = useVapiCall();
  
  // Fetch agent data if agentId is provided
  const { data: agentData } = useQuery({
    queryKey: ['agent', agentId],
    queryFn: async () => {
      if (!agentId) return null;
      
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('id', agentId)
        .single();
        
      if (error) throw error;
      
      console.log("Agent data loaded:", data);
      return data;
    },
    enabled: !!agentId,
  });

  // Update selected voice when agent data is loaded or changed
  useEffect(() => {
    if (agentData?.voice_id) {
      setSelectedVoice(agentData.voice_id);
      console.log("Voice ID loaded from agent data:", agentData.voice_id);
    } else if (agentVoiceId) {
      setSelectedVoice(agentVoiceId);
      console.log("Voice ID from props:", agentVoiceId);
    }
  }, [agentData, agentVoiceId]);
  
  // Validate phone number when it changes
  useEffect(() => {
    validatePhone(testPhone);
  }, [testPhone]);
  
  // Prepare default test message
  useEffect(() => {
    const defaultMessage = `Olá ${testName || "cliente"}, aqui é ${agentName} da empresa. Como posso ajudar você hoje?`;
    setTestMessage(defaultMessage);
    console.log("Default test message set:", defaultMessage);
  }, [testName, agentName]);
  
  // Get best available voice ID
  const getVoiceId = () => {
    // Priority 1: Voice selected in component
    if (selectedVoice) {
      console.log("Using voice ID from state:", selectedVoice);
      return selectedVoice;
    }
    
    // Priority 2: Voice associated with agent in database
    if (agentData?.voice_id) {
      console.log("Using voice ID from database:", agentData.voice_id);
      return agentData.voice_id;
    }
    
    // Priority 3: Fallback to default Portuguese voice
    console.log("Using default voice ID (Laura)");
    return "FGY2WhTYpPnrIDTdsKH5"; // Laura voice ID
  };

  // Validate phone number format
  const validatePhone = (phone: string) => {
    // Clean the number to contain only digits
    const cleanedPhone = phone.replace(/\D/g, '');
    
    // Check if it has at least 10 digits (area code + number)
    const isValid = cleanedPhone.length >= 10;
    setPhoneValid(isValid);
    return isValid;
  };

  const handleTestVoice = async () => {
    try {
      if (isPlaying) {
        // If already playing, stop playback
        stopAudio();
        setIsPlaying(false);
        return;
      }
      
      setIsPlaying(true);
      
      const voiceId = getVoiceId();
      console.log("Testing voice with voice ID:", voiceId);
      console.log("Text to be spoken:", testMessage);
      
      if (!testMessage.trim()) {
        throw new Error("Please enter a message to test");
      }
      
      // Generate the audio from text
      const audioData = await textToSpeech({
        text: testMessage,
        voiceId: voiceId
      });
      
      if (audioData) {
        setAudioContent(audioData);
        // Play the audio
        playAudio(audioData);
        toast.success("Test audio played successfully!");
      } else {
        throw new Error("Failed to generate audio");
      }
    } catch (err: any) {
      console.error("Error in voice test:", err);
      toast.error(`Error testing voice: ${err.message}`);
    } finally {
      setIsPlaying(false);
    }
  };

  const handleTestCall = async () => {
    try {
      if (!validatePhone(testPhone)) {
        toast.warning("Please enter a valid phone number (at least 10 digits)");
        return;
      }
      
      if (!testMessage.trim()) {
        toast.warning("Please enter a message for the call");
        return;
      }
      
      // Confirm number is in correct format (digits only)
      const cleanPhone = testPhone.replace(/\D/g, '');
      
      if (cleanPhone.length < 10) {
        toast.warning("Invalid phone number. Please check and try again.");
        return;
      }
      
      toast.info("Starting test call...");
      
      const voiceId = getVoiceId();
      console.log("Starting call with voice ID:", voiceId);
      console.log("Message to be sent:", testMessage);
      console.log("Phone number:", cleanPhone);
      
      // Add additional debug information
      console.log("voiceId type:", typeof voiceId);
      console.log("voiceId length:", voiceId ? voiceId.length : "undefined/null");
      console.log("Complete parameters for makeCall:", {
        agentId,
        campaignId,
        phoneNumber: cleanPhone,
        message: testMessage,
        leadId,
        voiceId
      });
      
      await makeCall({
        agentId: agentId || '',
        campaignId: campaignId,
        phoneNumber: cleanPhone,
        message: testMessage,
        leadId: leadId,
        voiceId: voiceId
      });
      
      toast.success("Test call initiated successfully!");
      
      if (onCallComplete) {
        onCallComplete();
      }
    } catch (err: any) {
      console.error("Error in test call:", err);
      toast.error(`Error making call: ${err.message}`);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTestPhone(value);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold text-center">
          Test Call
        </h3>
        <p className="text-sm text-center text-muted-foreground mb-2">
          Test agent {agentName}'s voice or start a test call
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="test-name">Name for test</Label>
          <Input 
            id="test-name"
            value={testName}
            onChange={(e) => setTestName(e.target.value)}
            placeholder="Customer name for testing"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="test-message">Agent message</Label>
          <Textarea
            id="test-message"
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            placeholder="Enter the message the agent should say"
            rows={3}
            className="resize-none"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="test-phone" className={!phoneValid ? "text-red-500" : ""}>
            Phone for test {!phoneValid && "(Invalid format)"}
          </Label>
          <Input 
            id="test-phone"
            value={testPhone}
            onChange={handlePhoneChange}
            placeholder="Area code + number (ex: 11999887766)"
            type="tel"
            className={!phoneValid ? "border-red-500" : ""}
          />
          {!phoneValid && (
            <p className="text-xs text-red-500 mt-1">
              Enter a valid number with area code + number (min. 10 digits)
            </p>
          )}
        </div>
        
        <div className="space-y-4">
          <Button 
            onClick={handleTestVoice} 
            className="w-full"
            disabled={isLoading || !testMessage.trim()}
            variant={isPlaying ? "secondary" : "default"}
          >
            {isPlaying ? (
              <>
                <StopCircle className="mr-2 h-4 w-4" />
                Stop Audio
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Test Agent Voice
              </>
            )}
          </Button>
          
          {audioContent && !isPlaying && (
            <div className="mb-2">
              <AudioPlayer audioData={audioContent} />
            </div>
          )}
          
          <Button 
            onClick={handleTestCall} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            disabled={isLoading || !testPhone || !phoneValid || !testMessage.trim()}
          >
            <Phone className="mr-2 h-4 w-4" />
            Start Test Call
          </Button>
        </div>
      </div>
    </div>
  );
}
