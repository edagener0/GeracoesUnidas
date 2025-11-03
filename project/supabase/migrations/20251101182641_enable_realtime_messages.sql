/*
  # Habilitar Supabase Realtime para Mensagens

  1. Alterações
    - Ativa Realtime para a tabela `messages`
    - Ativa Realtime para a tabela `conversations`
    - Garante que as subscrições WebSocket funcionam corretamente
  
  2. Notas Importantes
    - Isto permite que os clientes recebam atualizações em tempo real
    - As políticas RLS já existentes são respeitadas
    - Apenas participantes de conversas recebem mensagens
*/

-- Habilitar Realtime para a tabela de mensagens
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Habilitar Realtime para a tabela de conversas
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- Criar índice para melhorar performance das subscrições Realtime
CREATE INDEX IF NOT EXISTS messages_conversation_id_created_at_idx 
ON messages(conversation_id, created_at DESC);

-- Criar índice para melhorar performance de queries de mensagens não lidas
CREATE INDEX IF NOT EXISTS messages_conversation_id_is_read_idx 
ON messages(conversation_id, is_read) WHERE is_read = false;
