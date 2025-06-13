
-- Adicionar coluna conversation_log para armazenar logs detalhados da conversa
ALTER TABLE public.call_logs 
ADD COLUMN IF NOT EXISTS conversation_log jsonb;

-- Adicionar coluna websocket_url para armazenar a URL do WebSocket utilizada
ALTER TABLE public.call_logs 
ADD COLUMN IF NOT EXISTS websocket_url text;

-- Comentários para documentar as novas colunas
COMMENT ON COLUMN public.call_logs.conversation_log IS 'Logs detalhados da conversa em formato JSON incluindo eventos, timestamps e histórico';
COMMENT ON COLUMN public.call_logs.websocket_url IS 'URL do servidor WebSocket utilizado para a chamada (externo ou interno)';
