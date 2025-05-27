
export type CallLog = {
  id: number;
  call_sid: string;
  status: string;
  from_number: string;
  to_number: string;
  duration: number | null;
  agent_id: string | null;
  campaign_id: string | null;
  recorded_at: string;
  created_at: string;
}

export type Agent = {
  id: string;
  name: string;
  description: string;
  category: string;
  status: "active" | "paused" | "inactive";
  voice_id: string;
  created_at: string;
  updated_at: string;
  instructions: string | null;
  response_style: string | null;
  default_greeting: string | null;
  max_response_length: number | null;
  knowledge: string | null;
  ai_model: string | null;
  conversation_prompt: string | null;
  webhook_url: string | null;
  phone_number: string | null;
  assistant_id: string | null;
}

export type Campaign = {
  id: string;
  name: string;
  status: "active" | "paused" | "scheduled" | "completed";
  total_leads: number;
  completed_leads: number;
  agent_id: string;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
}

export type Lead = {
  id: string;
  campaign_id: string;
  name: string;
  phone: string;
  email: string;
  status: "pending" | "called" | "completed" | "failed";
  notes: string;
  created_at: string;
  updated_at: string;
}
