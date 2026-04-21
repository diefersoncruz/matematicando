-- Ranking System Schema for Matematicando

-- Table for tracking game scores and rankings
CREATE TABLE IF NOT EXISTS game_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sala_id UUID NOT NULL REFERENCES salas(id) ON DELETE CASCADE,
  player_name VARCHAR(100) NOT NULL,
  hits INTEGER NOT NULL DEFAULT 0,
  errors INTEGER NOT NULL DEFAULT 0,
  accuracy DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN (hits + errors) > 0 THEN ROUND((hits::DECIMAL / (hits + errors)::DECIMAL) * 100, 2)
      ELSE 0
    END
  ) STORED,
  total_time_seconds INTEGER NOT NULL DEFAULT 0,
  game_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_game_scores_sala_id ON game_scores(sala_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_player_name ON game_scores(player_name);
CREATE INDEX IF NOT EXISTS idx_game_scores_game_date ON game_scores(game_date);
CREATE INDEX IF NOT EXISTS idx_game_scores_hits ON game_scores(hits DESC);

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_game_scores_updated_at 
  BEFORE UPDATE ON game_scores 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view scores for any sala
CREATE POLICY "Users can view game scores" ON game_scores
  FOR SELECT USING (true);

-- Policy: Users can insert their own scores
CREATE POLICY "Users can insert game scores" ON game_scores
  FOR INSERT WITH CHECK (true);

-- Policy: Users can update their own scores (for game updates)
CREATE POLICY "Users can update game scores" ON game_scores
  FOR UPDATE USING (true);

-- Policy: Users can delete their own scores
CREATE POLICY "Users can delete game scores" ON game_scores
  FOR DELETE USING (true);

-- View for room rankings with calculated positions
CREATE OR REPLACE VIEW room_rankings AS
SELECT 
  gs.id,
  gs.sala_id,
  gs.player_name,
  gs.hits,
  gs.errors,
  gs.accuracy,
  gs.total_time_seconds,
  gs.game_date,
  ROW_NUMBER() OVER (PARTITION BY gs.sala_id ORDER BY gs.hits DESC, gs.accuracy DESC, gs.total_time_seconds ASC) as rank_position,
  s.nome as sala_nome,
  s.tipo as sala_tipo
FROM game_scores gs
JOIN salas s ON gs.sala_id = s.id
ORDER BY gs.sala_id, rank_position;

-- Function to get ranking for a specific sala
CREATE OR REPLACE FUNCTION get_sala_ranking(p_sala_id UUID, p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  rank_position INTEGER,
  player_name VARCHAR,
  hits INTEGER,
  errors INTEGER,
  accuracy DECIMAL,
  total_time_seconds INTEGER,
  game_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROW_NUMBER() OVER (ORDER BY hits DESC, accuracy DESC, total_time_seconds ASC) as rank_position,
    player_name,
    hits,
    errors,
    accuracy,
    total_time_seconds,
    game_date
  FROM game_scores
  WHERE sala_id = p_sala_id
  ORDER BY hits DESC, accuracy DESC, total_time_seconds ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to update or insert a player's score
CREATE OR REPLACE FUNCTION upsert_game_score(
  p_sala_id UUID,
  p_player_name VARCHAR,
  p_hits INTEGER,
  p_errors INTEGER,
  p_total_time_seconds INTEGER
)
RETURNS UUID AS $$
DECLARE
  v_score_id UUID;
BEGIN
  -- Update existing score for the same player in the same sala if it exists and is better
  UPDATE game_scores 
  SET 
    hits = GREATEST(hits, p_hits),
    errors = LEAST(errors, p_errors),
    total_time_seconds = LEAST(total_time_seconds, p_total_time_seconds),
    game_date = NOW()
  WHERE sala_id = p_sala_id AND player_name = p_player_name AND hits < p_hits
  RETURNING id INTO v_score_id;
  
  -- If no update was made (or no existing record), insert new score
  IF v_score_id IS NULL THEN
    INSERT INTO game_scores (sala_id, player_name, hits, errors, total_time_seconds)
    VALUES (p_sala_id, p_player_name, p_hits, p_errors, p_total_time_seconds)
    RETURNING id INTO v_score_id;
  END IF;
  
  RETURN v_score_id;
END;
$$ LANGUAGE plpgsql;

-- Sample data for testing (optional)
-- Uncomment and replace UUIDs with actual sala IDs from your salas table to test
/*
INSERT INTO game_scores (sala_id, player_name, hits, errors, total_time_seconds) VALUES
-- Replace 'your-sala-uuid-here' with actual UUIDs from your salas table
('your-sala-uuid-here', 'João Silva', 45, 5, 120),
('your-sala-uuid-here', 'Maria Santos', 38, 2, 95),
('your-sala-uuid-here', 'Pedro Oliveira', 42, 8, 110),
('your-sala-uuid-here', 'Ana Costa', 35, 3, 85),
('your-sala-uuid-here', 'Lucas Ferreira', 48, 7, 130);
*/
