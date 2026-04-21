-- Fix RLS policies for game_scores table to resolve 406 errors
-- Run this in your Supabase SQL Editor

-- Step 1: Check if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'game_scores' AND table_schema = 'public') THEN
    RAISE NOTICE 'game_scores table exists';
  ELSE
    RAISE NOTICE 'game_scores table does NOT exist - creating it now';
    
    -- Create the table if it doesn't exist
    CREATE TABLE game_scores (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      sala_id UUID NOT NULL,
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
  END IF;
END $$;

-- Step 2: Enable RLS if not already enabled
ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop all existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON game_scores;
DROP POLICY IF EXISTS "Enable insert for all users" ON game_scores;
DROP POLICY IF EXISTS "Enable update for all users" ON game_scores;
DROP POLICY IF EXISTS "Enable delete for all users" ON game_scores;
DROP POLICY IF EXISTS "Allow all operations on game_scores" ON game_scores;

-- Step 4: Create simple permissive policies
CREATE POLICY "Allow all operations on game_scores" ON game_scores
  FOR ALL USING (true) WITH CHECK (true);

-- Step 5: Test the policies
SELECT 'Testing game_scores access...' as status;
SELECT COUNT(*) as test_count FROM game_scores LIMIT 1;

-- Step 6: Test insert (optional)
-- Uncomment to test: INSERT INTO game_scores (sala_id, player_name, hits, errors, total_time_seconds) 
-- VALUES (gen_random_uuid(), 'Test User', 10, 2, 60) RETURNING id;

SELECT 'game_scores RLS policies fixed successfully' as status;
