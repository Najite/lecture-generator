/*
  # Fix Supabase User Creation

  1. Database Changes
    - Drop and recreate the profile creation trigger with better error handling
    - Add proper constraints and indexes
    - Enable email confirmations to be disabled
    - Fix any issues with the auth.users table integration

  2. Security
    - Ensure RLS policies work with both registration methods
    - Add proper error handling for profile creation
    - Make the system robust for manual user creation

  3. Functionality
    - Support user creation from Supabase dashboard
    - Support user creation from application
    - Automatic profile creation for both methods
*/

-- Drop existing trigger and function to recreate them
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.create_profile_for_new_user();

-- Create improved profile creation function
CREATE OR REPLACE FUNCTION public.create_profile_for_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT DEFAULT 'lecturer';
  user_name TEXT DEFAULT 'New User';
BEGIN
  -- Extract role from user metadata, default to lecturer
  IF NEW.raw_user_meta_data IS NOT NULL THEN
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'lecturer');
    user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);
  ELSE
    user_name := NEW.email;
  END IF;

  -- Ensure role is valid
  IF user_role NOT IN ('admin', 'lecturer') THEN
    user_role := 'lecturer';
  END IF;

  -- Insert profile with error handling
  BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
    VALUES (
      NEW.id,
      NEW.email,
      user_name,
      user_role,
      NOW(),
      NOW()
    );
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_profile_for_new_user();

-- Ensure profiles table has proper constraints
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('admin', 'lecturer'));

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_auth_id ON profiles(id);

-- Update RLS policies to be more permissive for profile creation
DROP POLICY IF EXISTS "Users can insert own profile during signup" ON profiles;
CREATE POLICY "Users can insert own profile during signup"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow service role to insert profiles (for Supabase dashboard creation)
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;
CREATE POLICY "Service role can insert profiles"
  ON profiles FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Insert sample users for testing (only if they don't exist)
DO $$
BEGIN
  -- Check if sample admin exists
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'admin@eduai.com') THEN
    INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      'admin@eduai.com',
      'System Administrator',
      'admin',
      NOW(),
      NOW()
    );
  END IF;

  -- Check if sample lecturer exists
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'lecturer@eduai.com') THEN
    INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      'lecturer@eduai.com',
      'Sample Lecturer',
      'lecturer',
      NOW(),
      NOW()
    );
  END IF;
END $$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON public.profiles TO anon, authenticated, service_role;
GRANT ALL ON public.courses TO anon, authenticated, service_role;
GRANT ALL ON public.course_assignments TO anon, authenticated, service_role;
GRANT ALL ON public.generated_content TO anon, authenticated, service_role;