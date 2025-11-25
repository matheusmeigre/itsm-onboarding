-- Execute este SQL no Supabase SQL Editor para atualizar a função cleanup_user_references
-- Este comando pode ser executado múltiplas vezes sem problema

CREATE OR REPLACE FUNCTION cleanup_user_references(target_user_id uuid)
RETURNS void AS $$
BEGIN
  -- Clean approved_by in documents table
  UPDATE documents 
  SET approved_by = NULL 
  WHERE approved_by = target_user_id;
  
  -- Clean assigned_by in user_roles table
  UPDATE user_roles 
  SET assigned_by = NULL 
  WHERE assigned_by = target_user_id;
  
  -- Delete document_history entries (changed_by has NO CASCADE)
  DELETE FROM document_history
  WHERE changed_by = target_user_id;
  
  -- Note: The following will CASCADE DELETE automatically:
  -- - documents.author_id (CASCADE) - will delete all documents created by user
  -- - comments.user_id (CASCADE)
  -- - user_roles.user_id (CASCADE)
  
  RAISE NOTICE 'Cleaned up references for user %', target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION cleanup_user_references(uuid) TO authenticated;
