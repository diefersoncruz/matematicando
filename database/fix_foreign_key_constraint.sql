-- Fix foreign key constraint violation for user_rooms table
-- Run this in your Supabase SQL Editor

-- Option 1: Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Enable RLS for users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create permissive policy for users table
CREATE POLICY "Allow all operations on users" ON users
  FOR ALL USING (true) WITH CHECK (true);

-- Option 2: Remove foreign key constraint from user_rooms (alternative approach)
-- Uncomment the following lines if you prefer to remove the constraint instead:

-- ALTER TABLE user_rooms DROP CONSTRAINT IF EXISTS user_rooms_user_id_fkey;

-- Function to automatically create user if not exists
CREATE OR REPLACE FUNCTION ensure_user_exists(p_user_id UUID, p_username TEXT)
RETURNS VOID AS $$
BEGIN
  -- Insert user if it doesn't exist
  INSERT INTO users (id, username, password_hash)
  VALUES (p_user_id, p_username, 'simple_auth_placeholder')
  ON CONFLICT (id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the fix
SELECT 'Foreign key constraint fix applied' as status;
