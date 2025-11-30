-- Create profiles table to store extended user information
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role user_role_type,
  first_name text,
  last_name text,
  age text,
  bio text,
  avatar text DEFAULT '👤',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Gerente can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM user_roles WHERE user_id = auth.uid()) = 'Gerente'
  );

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Trigger to sync profiles with user_roles
CREATE OR REPLACE FUNCTION sync_profile_role()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    UPDATE profiles 
    SET role = NEW.role 
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER sync_profile_role_trigger
  AFTER INSERT OR UPDATE ON user_roles
  FOR EACH ROW EXECUTE FUNCTION sync_profile_role();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION create_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, avatar)
  VALUES (NEW.id, NEW.email, '👤')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
CREATE TRIGGER create_profile_on_signup_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_profile_on_signup();

-- Migrate existing users to profiles table
INSERT INTO profiles (id, email, role, avatar)
SELECT 
  u.id,
  u.email,
  ur.role,
  '👤'
FROM auth.users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role;

-- Trigger to update updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
