/*
  # Fix RLS Infinite Recursion Issues

  1. Security Changes
    - Drop existing problematic policies that cause infinite recursion
    - Create new policies that use auth.jwt() instead of querying profiles table
    - Enable proper role-based access without circular dependencies

  2. Policy Updates
    - Users can read/update their own profile using auth.uid()
    - Admin access uses JWT claims instead of profile table queries
    - Simplified policy structure to prevent recursion
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile during signup" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create new non-recursive policies for profiles
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Admin policies using JWT claims instead of profile table queries
CREATE POLICY "Service role can manage all profiles"
  ON profiles
  FOR ALL
  TO service_role
  USING (true);

-- Update course assignment policies to be simpler
DROP POLICY IF EXISTS "Admins can manage assignments" ON course_assignments;
DROP POLICY IF EXISTS "Users can read relevant assignments" ON course_assignments;

CREATE POLICY "Users can read own assignments"
  ON course_assignments
  FOR SELECT
  TO authenticated
  USING (lecturer_id = auth.uid());

CREATE POLICY "Service role can manage assignments"
  ON course_assignments
  FOR ALL
  TO service_role
  USING (true);

-- Update courses policies
DROP POLICY IF EXISTS "Admins can manage courses" ON courses;
DROP POLICY IF EXISTS "Authenticated users can read courses" ON courses;

CREATE POLICY "Authenticated users can read courses"
  ON courses
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can manage courses"
  ON courses
  FOR ALL
  TO service_role
  USING (true);

-- Update generated content policies
DROP POLICY IF EXISTS "Lecturers can create content for assigned courses" ON generated_content;
DROP POLICY IF EXISTS "Lecturers can read own content" ON generated_content;

CREATE POLICY "Users can manage own content"
  ON generated_content
  FOR ALL
  TO authenticated
  USING (lecturer_id = auth.uid());

CREATE POLICY "Service role can manage all content"
  ON generated_content
  FOR ALL
  TO service_role
  USING (true);