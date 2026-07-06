-- Migration: adiciona colunas para reutilização de customer/card Pagar.me
-- e referência ao pedido Shopify (GraphQL gid), permitindo cobranças
-- 1-clique futuras (ex.: upsell pós-compra) sem pedir os dados do cartão novamente.

ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS pagarme_customer_id TEXT;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS pagarme_card_id TEXT;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS shopify_order_id TEXT;

COMMENT ON COLUMN pedidos.pagarme_customer_id IS 'ID do customer criado/resolvido pela Pagar.me no pedido original (para cobranças 1-clique futuras)';
COMMENT ON COLUMN pedidos.pagarme_card_id IS 'ID do cartão tokenizado pela Pagar.me no pedido original (apenas pagamentos credit_card); NULL para PIX';
COMMENT ON COLUMN pedidos.shopify_order_id IS 'GID GraphQL do pedido Shopify (admin_graphql_api_id), necessário para Order Edit (orderEditBegin) em upsells futuros';
