-- Criar tabela de assinaturas
CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  subscription_id TEXT NOT NULL UNIQUE,
  customer_id TEXT NOT NULL,
  status TEXT NOT NULL,
  first_due_date DATE NOT NULL,
  amount INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Adicionar índices para melhorar a performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_id ON subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
