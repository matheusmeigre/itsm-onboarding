-- Migration: Create pending_user_requests table
-- Description: Table to store user creation requests from Coordinators that need Manager approval

-- Create pending_user_requests table
CREATE TABLE IF NOT EXISTS pending_user_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  password_hash text NOT NULL,
  requested_role text NOT NULL CHECK (requested_role IN ('Analista', 'Coordenador', 'Gerente')),
  requested_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE pending_user_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Coordinators and Managers can view pending requests
CREATE POLICY "Coordenadores e Gerentes podem ver solicitações"
  ON pending_user_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('Coordenador', 'Gerente')
    )
  );

-- Coordinators can create pending requests
CREATE POLICY "Coordenadores podem criar solicitações"
  ON pending_user_requests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'Coordenador'
    )
    AND requested_by = auth.uid()
  );

-- Only Managers can update (approve/reject) requests
CREATE POLICY "Gerentes podem atualizar solicitações"
  ON pending_user_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'Gerente'
    )
  );

-- Create index for faster queries
CREATE INDEX idx_pending_user_requests_status ON pending_user_requests(status);
CREATE INDEX idx_pending_user_requests_requested_by ON pending_user_requests(requested_by);

-- Trigger to update updated_at
CREATE TRIGGER update_pending_user_requests_updated_at
  BEFORE UPDATE ON pending_user_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE pending_user_requests IS 'Stores user creation requests from Coordinators awaiting Manager approval';
COMMENT ON COLUMN pending_user_requests.email IS 'Email of the user to be created';
COMMENT ON COLUMN pending_user_requests.password_hash IS 'Hashed password for the new user';
COMMENT ON COLUMN pending_user_requests.requested_role IS 'Role requested for the new user';
COMMENT ON COLUMN pending_user_requests.requested_by IS 'Coordinator who requested the user creation';
COMMENT ON COLUMN pending_user_requests.status IS 'Status of the request: pending, approved, or rejected';
COMMENT ON COLUMN pending_user_requests.approved_by IS 'Manager who approved/rejected the request';
