-- Migration: estende looneca_upsell_data para suportar o novo fluxo de
-- upsell pós-compra com cobrança própria via Pagar.me (segunda Looneca, 50% off).
-- Substitui o fluxo antigo (Cartpanda), que só coletava dados de personalização
-- após uma cobrança feita fora deste sistema.

ALTER TABLE looneca_upsell_data ADD COLUMN IF NOT EXISTS cor TEXT;
ALTER TABLE looneca_upsell_data ADD COLUMN IF NOT EXISTS quantidade_pets INTEGER;
ALTER TABLE looneca_upsell_data ADD COLUMN IF NOT EXISTS acessorios TEXT;
ALTER TABLE looneca_upsell_data ADD COLUMN IF NOT EXISTS pedido_numero_original INTEGER;
ALTER TABLE looneca_upsell_data ADD COLUMN IF NOT EXISTS id_pagamento_upsell TEXT;
ALTER TABLE looneca_upsell_data ADD COLUMN IF NOT EXISTS valor_pago_upsell NUMERIC(10,2);
ALTER TABLE looneca_upsell_data ADD COLUMN IF NOT EXISTS status_pagamento_upsell TEXT;
ALTER TABLE looneca_upsell_data ADD COLUMN IF NOT EXISTS shopify_order_id TEXT;

-- Índice único parcial: impede duas cobranças "paid"/"pending" bem-sucedidas
-- para o mesmo pedido original (proteção contra clique duplo/corrida).
CREATE UNIQUE INDEX IF NOT EXISTS idx_looneca_upsell_unique_original
  ON looneca_upsell_data(pedido_numero_original)
  WHERE status_pagamento_upsell IN ('paid', 'pending');

CREATE INDEX IF NOT EXISTS idx_looneca_upsell_data_id_pagamento_upsell
  ON looneca_upsell_data(id_pagamento_upsell);

COMMENT ON COLUMN looneca_upsell_data.cor IS 'Cor escolhida para a segunda Looneca (upsell)';
COMMENT ON COLUMN looneca_upsell_data.quantidade_pets IS 'Quantidade de pets na segunda Looneca (deve corresponder ao tier de preço do pedido original)';
COMMENT ON COLUMN looneca_upsell_data.acessorios IS 'Acessórios selecionados para a segunda Looneca, separados por vírgula';
COMMENT ON COLUMN looneca_upsell_data.pedido_numero_original IS 'Número do pedido original (pedidos.pedido_numero) ao qual este upsell se refere';
COMMENT ON COLUMN looneca_upsell_data.id_pagamento_upsell IS 'ID da order Pagar.me gerada para esta cobrança de upsell';
COMMENT ON COLUMN looneca_upsell_data.valor_pago_upsell IS 'Valor efetivamente cobrado no upsell (50% do tier original)';
COMMENT ON COLUMN looneca_upsell_data.status_pagamento_upsell IS 'Status do pagamento do upsell retornado pela Pagar.me (paid, pending, failed, etc.)';
COMMENT ON COLUMN looneca_upsell_data.shopify_order_id IS 'GID do pedido Shopify onde o item de upsell foi anexado (Order Edit) ou do pedido separado criado como fallback';

COMMENT ON TABLE looneca_upsell_data IS 'Dados de personalização e pagamento do upsell pós-compra (segunda Looneca, 50% off), cobrado via Pagar.me';
