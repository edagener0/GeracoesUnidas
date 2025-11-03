/*
  # Adicionar Estado "Aguardando Pagamento" às Candidaturas

  1. Alterações na Tabela `room_applications`
    - Adiciona novo estado 'awaiting_payment' ao tipo ApplicationStatus
    - Permite o fluxo: pending → accepted → awaiting_payment → (pagamento confirmado)
  
  2. Fluxo Completo do Processo
    - **pending**: Candidatura enviada, aguardando revisão do host
    - **accepted**: Host aceitou a candidatura
    - **awaiting_payment**: Aluno precisa efetuar o pagamento para finalizar
    - **rejected**: Host rejeitou a candidatura
    
    Após pagamento confirmado:
    - Cria-se um registro em `rentals` com status 'active'
    - A candidatura pode ser marcada como processada ou removida
  
  3. Notas Importantes
    - O estado 'awaiting_payment' é obrigatório após 'accepted'
    - O pagamento deve ser processado antes de criar o rental
    - Esta mudança é retrocompatível com candidaturas existentes
*/

-- Adicionar novo valor ao enum ApplicationStatus
DO $$ 
BEGIN
  -- Verifica se o tipo já não tem o valor 'awaiting_payment'
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'awaiting_payment' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'application_status')
  ) THEN
    -- Adiciona o novo valor ao enum
    ALTER TYPE application_status ADD VALUE 'awaiting_payment';
  END IF;
END $$;

-- Criar índice para melhorar performance de queries com status
CREATE INDEX IF NOT EXISTS room_applications_status_idx ON room_applications(status);

-- Adicionar comentário para documentação
COMMENT ON COLUMN room_applications.status IS 'Status da candidatura: pending (aguardando), accepted (aceite), awaiting_payment (aguardando pagamento), rejected (rejeitada)';
