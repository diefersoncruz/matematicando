-- Room Configurations Schema
-- Links game configurations to specific rooms

-- Create room_configurations table
CREATE TABLE IF NOT EXISTS room_configurations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sala_id UUID NOT NULL REFERENCES salas(id) ON DELETE CASCADE,
  limite_tempo INTEGER DEFAULT 60,
  limite_fator_a INTEGER DEFAULT 10,
  limite_fator_b INTEGER DEFAULT 10,
  limite_negativo_fator_a INTEGER DEFAULT 0,
  limite_negativo_fator_b INTEGER DEFAULT 0,
  operacoes_adicao BOOLEAN DEFAULT true,
  operacoes_subtracao BOOLEAN DEFAULT true,
  operacoes_multiplicacao BOOLEAN DEFAULT true,
  operacoes_divisao BOOLEAN DEFAULT true,
  exibir_resposta_certa BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one configuration per room
  UNIQUE(sala_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_room_configurations_sala_id ON room_configurations(sala_id);

-- Enable Row Level Security
ALTER TABLE room_configurations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow all operations on room_configurations" ON room_configurations
  FOR ALL USING (true) WITH CHECK (true);

-- Function to get room configuration
CREATE OR REPLACE FUNCTION get_room_configuration(p_sala_id UUID)
RETURNS TABLE (
  limite_tempo INTEGER,
  limite_fator_a INTEGER,
  limite_fator_b INTEGER,
  limite_negativo_fator_a INTEGER,
  limite_negativo_fator_b INTEGER,
  operacoes_adicao BOOLEAN,
  operacoes_subtracao BOOLEAN,
  operacoes_multiplicacao BOOLEAN,
  operacoes_divisao BOOLEAN,
  exibir_resposta_certa BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rc.limite_tempo,
    rc.limite_fator_a,
    rc.limite_fator_b,
    rc.limite_negativo_fator_a,
    rc.limite_negativo_fator_b,
    rc.operacoes_adicao,
    rc.operacoes_subtracao,
    rc.operacoes_multiplicacao,
    rc.operacoes_divisao,
    rc.exibir_resposta_certa
  FROM room_configurations rc
  WHERE rc.sala_id = p_sala_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to save room configuration
CREATE OR REPLACE FUNCTION save_room_configuration(
  p_sala_id UUID,
  p_limite_tempo INTEGER DEFAULT 60,
  p_limite_fator_a INTEGER DEFAULT 10,
  p_limite_fator_b INTEGER DEFAULT 10,
  p_limite_negativo_fator_a INTEGER DEFAULT 0,
  p_limite_negativo_fator_b INTEGER DEFAULT 0,
  p_operacoes_adicao BOOLEAN DEFAULT true,
  p_operacoes_subtracao BOOLEAN DEFAULT true,
  p_operacoes_multiplicacao BOOLEAN DEFAULT true,
  p_operacoes_divisao BOOLEAN DEFAULT true,
  p_exibir_resposta_certa BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
  v_config_id UUID;
BEGIN
  INSERT INTO room_configurations (
    sala_id,
    limite_tempo,
    limite_fator_a,
    limite_fator_b,
    limite_negativo_fator_a,
    limite_negativo_fator_b,
    operacoes_adicao,
    operacoes_subtracao,
    operacoes_multiplicacao,
    operacoes_divisao,
    exibir_resposta_certa
  ) VALUES (
    p_sala_id,
    p_limite_tempo,
    p_limite_fator_a,
    p_limite_fator_b,
    p_limite_negativo_fator_a,
    p_limite_negativo_fator_b,
    p_operacoes_adicao,
    p_operacoes_subtracao,
    p_operacoes_multiplicacao,
    p_operacoes_divisao,
    p_exibir_resposta_certa
  )
  ON CONFLICT (sala_id) 
  DO UPDATE SET
    limite_tempo = p_limite_tempo,
    limite_fator_a = p_limite_fator_a,
    limite_fator_b = p_limite_fator_b,
    limite_negativo_fator_a = p_limite_negativo_fator_a,
    limite_negativo_fator_b = p_limite_negativo_fator_b,
    operacoes_adicao = p_operacoes_adicao,
    operacoes_subtracao = p_operacoes_subtracao,
    operacoes_multiplicacao = p_operacoes_multiplicacao,
    operacoes_divisao = p_operacoes_divisao,
    exibir_resposta_certa = p_exibir_resposta_certa,
    updated_at = NOW()
  RETURNING id INTO v_config_id;
  
  RETURN v_config_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test function
SELECT 'Room configurations schema created successfully' as status;
