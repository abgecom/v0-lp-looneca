-- Migration: adiciona coluna dispositivo_os à tabela pedidos
-- Armazena o sistema operacional do dispositivo do usuário (ios | android)
-- selecionado no modal da página /carrinho

ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS dispositivo_os TEXT;
