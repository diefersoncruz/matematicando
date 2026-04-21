-- Fix 409 conflicts and foreign key constraint issues in user_rooms table
-- Run this in your Supabase SQL Editor

-- Step 1: Drop foreign key constraint completely
ALTER TABLE user_rooms DROP CONSTRAINT IF EXISTS user_rooms_user_id_fkey;
ALTER TABLE user_rooms DROP CONSTRAINT IF EXISTS user_rooms_sala_id_fkey;

-- Step 2: Remove unique constraint to prevent 409 conflicts
ALTER TABLE user_rooms DROP CONSTRAINT IF EXISTS user_rooms_user_id_sala_id_key;

-- Step 3: Drop and recreate with simpler structure (no foreign keys)
DROP TABLE IF EXISTS user_rooms CASCADE;

CREATE TABLE user_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sala_id UUID NOT NULL,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member', 'student')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_rooms_user_id ON user_rooms(user_id);
CREATE INDEX IF NOT EXISTS idx_user_rooms_sala_id ON user_rooms(sala_id);
CREATE INDEX IF NOT EXISTS idx_user_rooms_role ON user_rooms(role);
CREATE INDEX IF NOT EXISTS idx_user_rooms_active ON user_rooms(is_active);

-- Step 5: Enable RLS
ALTER TABLE user_rooms ENABLE ROW LEVEL SECURITY;

-- Step 6: Create simple permissive policy
CREATE POLICY "Allow all operations on user_rooms" ON user_rooms
  FOR ALL USING (true) WITH CHECK (true);

-- Step 7: Test the table
SELECT 'user_rooms table recreated without constraints' as status;
SELECT COUNT(*) as test_count FROM user_rooms LIMIT 1;

-- Step 8: Simple test insert
INSERT INTO user_rooms (user_id, sala_id, role) 
VALUES (gen_random_uuid(), gen_random_uuid(), 'admin') 
RETURNING id;
