-- Update User Schema to Include Name and Email
-- Run this in your Supabase SQL Editor

-- Step 1: Add new columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS name VARCHAR(100),
ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE;

-- Step 2: Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_name ON users(name);

-- Step 3: Update existing users to have default values (optional)
UPDATE users 
SET name = username, 
    email = username || '@matematicando.local' 
WHERE name IS NULL OR email IS NULL;

-- Step 4: Create new function to create user with details
CREATE OR REPLACE FUNCTION create_user_with_details(
    p_name TEXT,
    p_email TEXT,
    p_username TEXT,
    p_password TEXT
)
RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
    v_email_count INTEGER;
BEGIN
    -- Check if email already exists
    SELECT COUNT(*) INTO v_email_count
    FROM users
    WHERE email = p_email;
    
    IF v_email_count > 0 THEN
        RAISE EXCEPTION 'Email já está em uso';
    END IF;
    
    -- Insert user with all details - CORRECTED: name goes to name field, username to username field
    INSERT INTO users (name, email, username, password_hash)
    VALUES (p_name, p_email, p_username, hash_password(p_password))
    RETURNING id INTO v_user_id;
    
    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Update existing create_user function to maintain compatibility
CREATE OR REPLACE FUNCTION create_user(p_username TEXT, p_password TEXT)
RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Insert user with default name and email for backward compatibility
    INSERT INTO users (name, email, username, password_hash)
    VALUES (p_username, p_username || '@matematicando.local', p_username, hash_password(p_password))
    RETURNING id INTO v_user_id;
    
    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Update RLS policies to handle new fields
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Step 7: Create function to check if email exists
CREATE OR REPLACE FUNCTION check_email_exists(p_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_email_count INTEGER;
BEGIN
    -- Check if email already exists
    SELECT COUNT(*) INTO v_email_count
    FROM users
    WHERE email = p_email;
    
    RETURN v_email_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test function
SELECT 'User schema updated successfully' as status;
