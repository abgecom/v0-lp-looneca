-- Adicionar coluna de cupom na tabela pedidos
ALTER TABLE pedidos 
ADD COLUMN IF NOT EXISTS cupom_codigo TEXT DEFAULT NULL;

ALTER TABLE pedidos 
ADD COLUMN IF NOT EXISTS cupom_desconto_percent NUMERIC DEFAULT NULL;

ALTER TABLE pedidos 
ADD COLUMN IF NOT EXISTS cupom_desconto_valor NUMERIC DEFAULT NULL;

-- Comentário para documentação
COMMENT ON COLUMN pedidos.cupom_codigo IS 'Código do cupom aplicado pelo cliente';
COMMENT ON COLUMN pedidos.cupom_desconto_percent IS 'Porcentagem de desconto do cupom';
COMMENT ON COLUMN pedidos.cupom_desconto_valor IS 'Valor em reais do desconto aplicado';
