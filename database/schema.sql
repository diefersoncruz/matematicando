-- Create salas table for the matematicando application
-- This table stores information about math study rooms/salas

CREATE TABLE IF NOT EXISTS salas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    data_expiracao DATE,
    capacidade INTEGER,
    tipo VARCHAR(50) DEFAULT 'aula' CHECK (tipo IN ('aula', 'estudo', 'prova', 'tutoria')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_salas_created_at ON salas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_salas_tipo ON salas(tipo);
CREATE INDEX IF NOT EXISTS idx_salas_data_expiracao ON salas(data_expiracao);

-- Add RLS (Row Level Security) policies
ALTER TABLE salas ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous users to read all salas (public access)
CREATE POLICY "Allow anonymous read access" ON salas
    FOR SELECT USING (true);

-- Policy: Allow anonymous users to insert salas (public access)
CREATE POLICY "Allow anonymous insert" ON salas
    FOR INSERT WITH CHECK (true);

-- Policy: Allow anonymous users to update their own salas
CREATE POLICY "Allow anonymous update" ON salas
    FOR UPDATE USING (true);

-- Policy: Allow anonymous users to delete salas
CREATE POLICY "Allow anonymous delete" ON salas
    FOR DELETE USING (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at on row updates
CREATE TRIGGER update_salas_updated_at 
    BEFORE UPDATE ON salas 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing (optional)
INSERT INTO salas (nome, descricao, data_expiracao, capacidade, tipo) VALUES
('Matemática Básica', 'Conteúdo fundamental para o ensino médio', '2024-12-31', 50, 'aula'),
('Geometria Analítica', 'Estudo de pontos, retas e planos no espaço', '2024-11-30', 30, 'aula'),
('Cálculo I', 'Limites, derivadas e integrais', NULL, 40, 'aula'),
('Sala de Estudo', 'Espaço para estudo individual ou em grupo', NULL, 25, 'estudo'),
('Prova de Matemática', 'Ambiente controlado para avaliações', '2024-10-15', 20, 'prova'),
('Tutoria de Álgebra', 'Sessões de apoio e esclarecimento de dúvidas', NULL, 15, 'tutoria')
ON CONFLICT DO NOTHING;
