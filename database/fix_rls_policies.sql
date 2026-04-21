-- Fix RLS policies for game_scores table
-- Run this in your Supabase SQL Editor

-- Step 1: Check current RLS status
SELECT 
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'game_scores' AND schemaname = 'public';

-- Step 2: Check existing policies
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'game_scores' AND schemaname = 'public';

-- Step 3: Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON game_scores;
DROP POLICY IF EXISTS "Enable insert for all users" ON game_scores;
DROP POLICY IF EXISTS "Enable update for all users" ON game_scores;
DROP POLICY IF EXISTS "Enable delete for all users" ON game_scores;

-- Step 4: Enable RLS if not already enabled
ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;

-- Step 5: Create simple permissive policies
CREATE POLICY "Allow all operations on game_scores" ON game_scores
  FOR ALL USING (true) WITH CHECK (true);

-- Step 6: Test the policies
SELECT 'Testing RLS policies...' as status;

-- This should work now
SELECT COUNT(*) as test_count FROM game_scores LIMIT 1;

-- Step 7: Test insert (optional)
-- INSERT INTO game_scores (sala_id, player_name, hits, errors, total_time_seconds) 
-- VALUES (gen_random_uuid(), 'RLS Test', 5, 1, 30) RETURNING id;
