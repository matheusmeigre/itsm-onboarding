-- Function to cleanup user references before deletion
-- This removes foreign key references that don't have ON DELETE CASCADE

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
  
  -- Note: The following will CASCADE DELETE automatically:
  -- - documents.author_id (CASCADE)
  -- - document_history.changed_by (CASCADE via document deletion)
  -- - comments.user_id (CASCADE)
  -- - user_roles.user_id (CASCADE)
  
  RAISE NOTICE 'Cleaned up references for user %', target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION cleanup_user_references(uuid) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION cleanup_user_references(uuid) IS 
'Removes foreign key references for a user before deletion. 
Used by admin panel to clean up approved_by and assigned_by references 
that do not have ON DELETE CASCADE constraint.';
