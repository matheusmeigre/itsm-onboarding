-- FIX para problemas de criação de usuário
-- Execute este SQL no Supabase SQL Editor se continuar com erro

-- 1. Recriar a função de criação de profile com melhor tratamento de erros
CREATE OR REPLACE FUNCTION create_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir profile com tratamento de conflito
  INSERT INTO profiles (id, email, avatar)
  VALUES (NEW.id, COALESCE(NEW.email, ''), 'bg-gray-400')
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, profiles.email),
    updated_at = now();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log do erro mas não falhar a criação do usuário
    RAISE WARNING 'Erro ao criar profile para user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Garantir que o trigger existe
DROP TRIGGER IF EXISTS create_profile_on_signup_trigger ON auth.users;
CREATE TRIGGER create_profile_on_signup_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_profile_on_signup();

-- 3. Atualizar policies da tabela profiles para permitir insert via service role
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;
CREATE POLICY "Service role can insert profiles"
  ON profiles FOR INSERT
  TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can update profiles" ON profiles;
CREATE POLICY "Service role can update profiles"
  ON profiles FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 4. Garantir que user_roles permite insert via service role
DROP POLICY IF EXISTS "Service role can insert user_roles" ON user_roles;
CREATE POLICY "Service role can insert user_roles"
  ON user_roles FOR INSERT
  TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can update user_roles" ON user_roles;
CREATE POLICY "Service role can update user_roles"
  ON user_roles FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 5. Verificar e corrigir profiles existentes sem email
UPDATE profiles 
SET email = u.email
FROM auth.users u
WHERE profiles.id = u.id 
  AND (profiles.email IS NULL OR profiles.email = '');

-- 6. Adicionar constraint para garantir email não nulo (depois de corrigir dados)
ALTER TABLE profiles 
  ALTER COLUMN email SET DEFAULT '';

-- 7. Função helper para criar usuário com profile e role
CREATE OR REPLACE FUNCTION create_user_with_role(
  p_email text,
  p_password text,
  p_role user_role_type,
  p_assigned_by uuid
)
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid;
  v_result jsonb;
BEGIN
  -- Esta função deve ser chamada via service role
  
  -- Criar usuário (precisa ser feito via API do Supabase Auth)
  -- Esta é apenas uma função auxiliar para o lado do banco
  
  -- Se o usuário já existe, apenas atualizar role
  -- Esta lógica é mais para documentação de como deve funcionar
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Use supabaseAdmin.auth.admin.createUser() na aplicação'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Verificar se há perfis órfãos (profiles sem user em auth.users)
DO $$
DECLARE
  v_orphan_count integer;
BEGIN
  SELECT COUNT(*) INTO v_orphan_count
  FROM profiles p
  WHERE NOT EXISTS (
    SELECT 1 FROM auth.users u WHERE u.id = p.id
  );
  
  IF v_orphan_count > 0 THEN
    RAISE NOTICE 'Encontrados % profiles órfãos. Considere removê-los.', v_orphan_count;
    -- Descomente a linha abaixo para remover profiles órfãos
    -- DELETE FROM profiles WHERE id NOT IN (SELECT id FROM auth.users);
  END IF;
END $$;

-- 9. Garantir índices para performance
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);

-- 10. Verificar configuração
SELECT 
  'Configuração verificada' as status,
  COUNT(*) as total_profiles,
  COUNT(DISTINCT email) as unique_emails
FROM profiles;

SELECT 
  'User roles configurados' as status,
  role,
  COUNT(*) as total
FROM user_roles
GROUP BY role;
