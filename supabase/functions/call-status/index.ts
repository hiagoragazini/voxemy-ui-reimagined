
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Call status webhook received');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method === 'POST') {
      const formData = await req.formData();
      const callStatus = formData.get('CallStatus') as string;
      const callSid = formData.get('CallSid') as string;
      const from = formData.get('From') as string;
      const to = formData.get('To') as string;
      const duration = formData.get('CallDuration') as string;
      const recordingUrl = formData.get('RecordingUrl') as string;
      const transcriptionText = formData.get('TranscriptionText') as string;
      
      // Parâmetros extras do callback
      const agentId = formData.get('agentId') as string;
      const campaignId = formData.get('campaignId') as string;
      const leadId = formData.get('leadId') as string;
      const recordCall = formData.get('recordCall') === 'true';
      const transcribeCall = formData.get('transcribeCall') === 'true';

      console.log('Call status data:', {
        callStatus,
        callSid,
        from,
        to,
        duration,
        agentId,
        campaignId,
        leadId
      });

      // Atualizar ou criar entrada no call_logs
      const { error: logError } = await supabase
        .from('call_logs')
        .upsert({
          call_sid: callSid,
          status: callStatus,
          from_number: from,
          to_number: to,
          duration: duration ? parseInt(duration, 10) : null,
          agent_id: agentId || null,
          campaign_id: campaignId || null,
          lead_id: leadId || null,
          transcription: transcriptionText || null,
          recorded_at: new Date().toISOString()
        }, { onConflict: 'call_sid' });

      if (logError) {
        console.error('Erro ao atualizar call_logs:', logError);
      } else {
        console.log('Call log atualizado com sucesso');
      }

      // Atualizar status do lead se fornecido
      if (leadId) {
        let leadStatus = 'called';
        let callResult = 'Ligação em andamento';

        switch (callStatus) {
          case 'completed':
            leadStatus = 'completed';
            callResult = `Ligação concluída (${duration}s)`;
            break;
          case 'busy':
            leadStatus = 'busy';
            callResult = 'Ocupado';
            break;
          case 'no-answer':
            leadStatus = 'no-answer';
            callResult = 'Não atendeu';
            break;
          case 'failed':
            leadStatus = 'failed';
            callResult = 'Ligação falhou';
            break;
          case 'canceled':
            leadStatus = 'failed';
            callResult = 'Ligação cancelada';
            break;
        }

        const updateData: any = {
          status: leadStatus,
          call_result: callResult,
          call_duration: duration || null
        };

        if (recordingUrl) {
          updateData.recording_url = recordingUrl;
        }

        if (transcriptionText) {
          updateData.transcription = transcriptionText;
        }

        const { error: leadError } = await supabase
          .from('leads')
          .update(updateData)
          .eq('id', leadId);

        if (leadError) {
          console.error('Erro ao atualizar lead:', leadError);
        } else {
          console.log(`Lead ${leadId} atualizado para status: ${leadStatus}`);
        }
      }

      // Atualizar métricas da campanha se fornecido
      if (campaignId && callStatus === 'completed') {
        const { error: campaignError } = await supabase
          .from('campaigns')
          .update({
            completed_leads: 'completed_leads + 1',
            updated_at: new Date().toISOString()
          })
          .eq('id', campaignId);

        if (campaignError) {
          console.error('Erro ao atualizar campanha:', campaignError);
        } else {
          console.log(`Campanha ${campaignId} atualizada - lead concluído`);
        }
      }

      return new Response(JSON.stringify({ status: 'processed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Erro no webhook call-status:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
