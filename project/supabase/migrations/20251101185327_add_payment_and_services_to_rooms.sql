/*
  # Adicionar M\u00e9todos de Pagamento e Servi\u00e7os aos Quartos

  1. Novas Colunas na Tabela `rooms`
    - `payment_methods` (text[]) - M\u00e9todos de pagamento aceitos (Transfer\u00eancia, MB WAY, Dinheiro, etc.)
    - `services` (jsonb) - Servi\u00e7os adicionais oferecidos com pre\u00e7os
      Exemplo: {
        "room_cleaning": { "enabled": true, "price": 50 },
        "lunch": { "enabled": true, "price": 150 },
        "dinner": { "enabled": true, "price": 150 },
        "custom_services": [
          { "name": "Lavandaria", "price": 30 }
        ]
      }
    - `total_monthly_price` (numeric) - Pre\u00e7o total mensal incluindo servi\u00e7os

  2. Notas Importantes
    - Os servi\u00e7os s\u00e3o opcionais e personalizaveis
    - O pre\u00e7o total \u00e9 calculado automaticamente
    - Compatibilidade com quartos existentes (valores default)
*/

-- Adicionar colunas \u00e0 tabela rooms
ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS payment_methods text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS services jsonb DEFAULT '{"room_cleaning":{"enabled":false,"price":0},"lunch":{"enabled":false,"price":0},"dinner":{"enabled":false,"price":0},"custom_services":[]}',
ADD COLUMN IF NOT EXISTS total_monthly_price numeric DEFAULT 0;

-- Atualizar total_monthly_price para quartos existentes (igualando ao monthly_price)
UPDATE rooms 
SET total_monthly_price = monthly_price 
WHERE total_monthly_price = 0 OR total_monthly_price IS NULL;

-- Criar \u00edndice para melhorar performance de queries com servi\u00e7os
CREATE INDEX IF NOT EXISTS rooms_services_idx ON rooms USING GIN (services);

-- Adicionar coment\u00e1rios para documenta\u00e7\u00e3o
COMMENT ON COLUMN rooms.payment_methods IS 'M\u00e9todos de pagamento aceitos pelo host';
COMMENT ON COLUMN rooms.services IS 'Servi\u00e7os adicionais oferecidos com pre\u00e7os';
COMMENT ON COLUMN rooms.total_monthly_price IS 'Pre\u00e7o total mensal incluindo servi\u00e7os selecionados';
