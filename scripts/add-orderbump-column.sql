-- Adicionar coluna para order bump na tabela pedidos
ALTER TABLE pedidos 
ADD COLUMN IF NOT EXISTS order_bump JSONB DEFAULT NULL;

-- Comentário para a coluna
COMMENT ON COLUMN pedidos.order_bump IS 'Dados do order bump (papel de presente) selecionado pelo cliente';
