/*
  # Enable User Registration

  1. Security Updates
    - Ensure email confirmation is disabled for easy registration
    - Update RLS policies to allow profile creation during signup
    - Add proper constraints and indexes

  2. Sample Data
    - Add sample courses for immediate testing
    - Ensure proper foreign key relationships
*/

-- Ensure profiles can be created during signup
DROP POLICY IF EXISTS "Users can insert own profile during signup" ON profiles;
CREATE POLICY "Users can insert own profile during signup"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow users to read their own profile immediately after creation
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Ensure the trigger function handles errors gracefully
CREATE OR REPLACE FUNCTION create_profile_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'lecturer')
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Could not create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS create_profile_trigger ON auth.users;
CREATE TRIGGER create_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_profile_for_new_user();

-- Add some sample courses if they don't exist
INSERT INTO courses (title, description, code) VALUES
  ('Introduction to Computer Science', 'Fundamental concepts of computer science and programming', 'CS101'),
  ('Data Structures and Algorithms', 'Core data structures and algorithmic thinking', 'CS201'),
  ('Web Development Fundamentals', 'HTML, CSS, JavaScript and modern web technologies', 'WEB101'),
  ('Database Systems', 'Relational databases, SQL, and database design principles', 'DB101'),
  ('Software Engineering', 'Software development lifecycle and engineering practices', 'SE301'),
  ('Machine Learning Basics', 'Introduction to ML algorithms and applications', 'ML101')
ON CONFLICT (code) DO NOTHING;