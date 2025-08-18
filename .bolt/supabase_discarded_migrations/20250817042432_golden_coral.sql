/*
  # Fix RLS policies for profiles table

  1. Security Changes
    - Drop all existing policies that cause infinite recursion
    - Create simple policies that don't reference the profiles table
    - Enable RLS on profiles table
    - Add policies for authenticated users and service role

  2. Policy Details
    - Users can read and update their own profile using auth.uid()
    - Users can insert their own profile during registration
    - Service role has full access for admin operations
*/

-- Drop all existing policies on profiles table
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON profiles;

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create simple policies that don't cause recursion
CREATE POLICY "Enable read for own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Enable insert for own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Service role policy for admin operations
CREATE POLICY "Service role full access"
  ON profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Also fix other tables to prevent similar issues
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_content ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies for other tables
DROP POLICY IF EXISTS "Authenticated users can read courses" ON courses;
DROP POLICY IF EXISTS "Service role can manage courses" ON courses;

CREATE POLICY "Enable read courses for authenticated users"
  ON courses
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role courses access"
  ON courses
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Course assignments policies
DROP POLICY IF EXISTS "Users can read own assignments" ON course_assignments;
DROP POLICY IF EXISTS "Service role can manage assignments" ON course_assignments;

CREATE POLICY "Enable read assignments for lecturers"
  ON course_assignments
  FOR SELECT
  TO authenticated
  USING (lecturer_id = auth.uid());

CREATE POLICY "Service role assignments access"
  ON course_assignments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Generated content policies
DROP POLICY IF EXISTS "Users can manage own content" ON generated_content;
DROP POLICY IF EXISTS "Service role can manage all content" ON generated_content;

CREATE POLICY "Enable content access for lecturers"
  ON generated_content
  FOR ALL
  TO authenticated
  USING (lecturer_id = auth.uid())
  WITH CHECK (lecturer_id = auth.uid());

CREATE POLICY "Service role content access"
  ON generated_content
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);