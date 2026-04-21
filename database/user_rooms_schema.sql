-- User-Room Associations Schema
-- Tracks which users are linked to which rooms

-- Create user_rooms association table
CREATE TABLE IF NOT EXISTS user_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sala_id UUID NOT NULL REFERENCES salas(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member', 'student')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  
  -- Ensure unique user-room combinations
  UNIQUE(user_id, sala_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_rooms_user_id ON user_rooms(user_id);
CREATE INDEX IF NOT EXISTS idx_user_rooms_sala_id ON user_rooms(sala_id);
CREATE INDEX IF NOT EXISTS idx_user_rooms_role ON user_rooms(role);
CREATE INDEX IF NOT EXISTS idx_user_rooms_active ON user_rooms(is_active);

-- Enable Row Level Security
ALTER TABLE user_rooms ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own room associations" ON user_rooms
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own room associations" ON user_rooms
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own room associations" ON user_rooms
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own room associations" ON user_rooms
  FOR DELETE USING (auth.uid() = user_id);

-- Function to get user's rooms
CREATE OR REPLACE FUNCTION get_user_rooms(p_user_id UUID)
RETURNS TABLE (
  sala_id UUID,
  sala_nome VARCHAR,
  sala_tipo VARCHAR,
  sala_descricao TEXT,
  role VARCHAR,
  joined_at TIMESTAMP WITH TIME ZONE,
  last_accessed TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.nome,
    s.tipo,
    s.descricao,
    ur.role,
    ur.joined_at,
    ur.last_accessed,
    ur.is_active
  FROM user_rooms ur
  JOIN salas s ON ur.sala_id = s.id
  WHERE ur.user_id = p_user_id AND ur.is_active = true
  ORDER BY ur.last_accessed DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to join user to room
CREATE OR REPLACE FUNCTION join_room(p_user_id UUID, p_sala_id UUID, p_role VARCHAR DEFAULT 'member')
RETURNS UUID AS $$
DECLARE
  v_association_id UUID;
BEGIN
  -- Insert or update user-room association
  INSERT INTO user_rooms (user_id, sala_id, role, last_accessed)
  VALUES (p_user_id, p_sala_id, p_role, NOW())
  ON CONFLICT (user_id, sala_id) 
  DO UPDATE SET 
    role = p_role,
    last_accessed = NOW(),
    is_active = true
  RETURNING id INTO v_association_id;
  
  RETURN v_association_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to leave room
CREATE OR REPLACE FUNCTION leave_room(p_user_id UUID, p_sala_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE user_rooms 
  SET is_active = false 
  WHERE user_id = p_user_id AND sala_id = p_sala_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update last accessed
CREATE OR REPLACE FUNCTION update_room_access(p_user_id UUID, p_sala_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE user_rooms 
  SET last_accessed = NOW() 
  WHERE user_id = p_user_id AND sala_id = p_sala_id AND is_active = true;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test function
SELECT 'User-Rooms schema created successfully' as status;
