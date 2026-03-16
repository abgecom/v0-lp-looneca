-- Create the looneca_upsell_data table for storing upsell information
CREATE TABLE IF NOT EXISTS looneca_upsell_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email_cliente TEXT NOT NULL,
  tipo_raca_pet TEXT NOT NULL,
  fotos_urls TEXT[] NOT NULL,
  observacao TEXT
);

-- Create an index on email_cliente for faster lookups
CREATE INDEX IF NOT EXISTS idx_looneca_upsell_data_email ON looneca_upsell_data(email_cliente);

-- Add a comment to the table
COMMENT ON TABLE looneca_upsell_data IS 'Stores pet personalization data for One-Click Upsell purchases from Cartpanda';
