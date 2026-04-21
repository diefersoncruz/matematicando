-- User Management Schema for Matematicando
-- Simple username and password authentication

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for updated_at
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_users_updated_at();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Hash password function (using pgcrypto extension)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION hash_password(password TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN crypt(password, gen_salt('bf'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION verify_password(password TEXT, hashed TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN crypt(password, hashed) = hashed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create user with hashed password
CREATE OR REPLACE FUNCTION create_user(p_username TEXT, p_password TEXT)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Insert user with hashed password
  INSERT INTO users (id, username, password_hash)
  VALUES (gen_random_uuid(), p_username, hash_password(p_password))
  RETURNING id INTO v_user_id;
  
  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to authenticate user
CREATE OR REPLACE FUNCTION authenticate_user(p_username TEXT, p_password TEXT)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  authenticated BOOLEAN
) AS $$
DECLARE
  v_user_id UUID;
  v_password_hash TEXT;
BEGIN
  -- Get user by username
  SELECT id, password_hash INTO v_user_id, v_password_hash
  FROM users
  WHERE username = p_username;
  
  -- Check if user exists and password matches
  IF v_user_id IS NOT NULL AND verify_password(p_password, v_password_hash) THEN
    -- Update last login
    UPDATE users SET last_login = NOW() WHERE id = v_user_id;
    
    RETURN QUERY
    SELECT v_user_id, p_username, true;
  ELSE
    RETURN QUERY
    SELECT NULL::UUID, NULL::TEXT, false;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test function
SELECT 'User management schema created successfully' as status;
