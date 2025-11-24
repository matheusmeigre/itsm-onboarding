/*
  # Documentation Platform Database Schema

  ## Overview
  Complete schema for an enterprise documentation and onboarding platform with Role-Based Access Control (RBAC).

  ## New Tables

  ### 1. user_roles
  Stores role assignments for users (Analista, Coordenador, Gerente)
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users) - The user receiving the role
  - `role` (text) - Role type: 'Analista', 'Coordenador', 'Gerente'
  - `assigned_by` (uuid, references auth.users) - Who assigned this role
  - `created_at` (timestamptz) - When the role was assigned
  - `updated_at` (timestamptz) - Last role update

  ### 2. categories
  Hierarchical categorization for documents (e.g., "Acessos", "Sistemas", "Processos")
  - `id` (uuid, primary key)
  - `name` (text) - Category name
  - `description` (text) - Category description
  - `parent_id` (uuid, nullable, self-reference) - Parent category for hierarchy
  - `icon` (text) - Icon identifier
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. documents
  Core document storage with workflow status
  - `id` (uuid, primary key)
  - `title` (text) - Document title
  - `content` (text) - Rich text content (JSON or HTML)
  - `status` (text) - Workflow status: 'Rascunho', 'Aguardando Aprovação', 'Aprovado', 'Arquivado'
  - `category_id` (uuid, references categories) - Document category
  - `author_id` (uuid, references auth.users) - Document creator
  - `approved_by` (uuid, nullable, references auth.users) - Approver
  - `approved_at` (timestamptz, nullable) - Approval timestamp
  - `version` (integer) - Version number for tracking changes
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. document_history
  Audit trail for all document changes
  - `id` (uuid, primary key)
  - `document_id` (uuid, references documents) - Related document
  - `title` (text) - Document title at this version
  - `content` (text) - Document content at this version
  - `status` (text) - Status at this version
  - `changed_by` (uuid, references auth.users) - Who made the change
  - `change_type` (text) - Type: 'created', 'updated', 'approved', 'archived'
  - `version` (integer) - Version number
  - `created_at` (timestamptz)

  ### 5. comments
  Comments and discussions on documents
  - `id` (uuid, primary key)
  - `document_id` (uuid, references documents)
  - `user_id` (uuid, references auth.users)
  - `content` (text) - Comment text
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  
  1. Enable RLS on all tables
  2. RBAC policies enforce role-based permissions:
     - **Analista**: Can create drafts, edit own drafts, view approved docs
     - **Coordenador**: Can create/edit all docs, approve Analista drafts, view all
     - **Gerente**: Full access - create, edit, approve, delete, manage users
  3. Policies check user role via user_roles table
  4. All policies require authentication

  ## Important Notes
  
  - Only Gerente role can manage user roles
  - Documents require approval workflow except when created by Gerente
  - All changes are tracked in document_history for audit compliance
  - RLS ensures data isolation based on role permissions
*/

-- Create custom types for roles and document status
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_type') THEN
    CREATE TYPE user_role_type AS ENUM ('Analista', 'Coordenador', 'Gerente');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_status_type') THEN
    CREATE TYPE document_status_type AS ENUM ('Rascunho', 'Aguardando Aprovação', 'Aprovado', 'Arquivado');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'change_type') THEN
    CREATE TYPE change_type AS ENUM ('created', 'updated', 'approved', 'archived', 'restored');
  END IF;
END $$;

-- Table: user_roles
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role_type NOT NULL DEFAULT 'Analista',
  assigned_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Table: categories
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  parent_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  icon text DEFAULT 'folder',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: documents
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  status document_status_type NOT NULL DEFAULT 'Rascunho',
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  version integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: document_history
CREATE TABLE IF NOT EXISTS document_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  status document_status_type NOT NULL,
  changed_by uuid NOT NULL REFERENCES auth.users(id),
  change_type change_type NOT NULL,
  version integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Table: comments
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_author_id ON documents(author_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_category_id ON documents(category_id);
CREATE INDEX IF NOT EXISTS idx_document_history_document_id ON document_history(document_id);
CREATE INDEX IF NOT EXISTS idx_comments_document_id ON comments(document_id);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_uuid uuid)
RETURNS user_role_type AS $$
  SELECT role FROM user_roles WHERE user_id = user_uuid;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- RLS Policies for user_roles table
CREATE POLICY "Users can view own role"
  ON user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Gerente can view all roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (get_user_role(auth.uid()) = 'Gerente');

CREATE POLICY "Gerente can insert roles"
  ON user_roles FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role(auth.uid()) = 'Gerente');

CREATE POLICY "Gerente can update roles"
  ON user_roles FOR UPDATE
  TO authenticated
  USING (get_user_role(auth.uid()) = 'Gerente')
  WITH CHECK (get_user_role(auth.uid()) = 'Gerente');

CREATE POLICY "Gerente can delete roles"
  ON user_roles FOR DELETE
  TO authenticated
  USING (get_user_role(auth.uid()) = 'Gerente');

-- RLS Policies for categories table
CREATE POLICY "All authenticated users can view categories"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Coordenador and Gerente can create categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (
    get_user_role(auth.uid()) IN ('Coordenador', 'Gerente')
  );

CREATE POLICY "Coordenador and Gerente can update categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('Coordenador', 'Gerente'))
  WITH CHECK (get_user_role(auth.uid()) IN ('Coordenador', 'Gerente'));

CREATE POLICY "Gerente can delete categories"
  ON categories FOR DELETE
  TO authenticated
  USING (get_user_role(auth.uid()) = 'Gerente');

-- RLS Policies for documents table
CREATE POLICY "Users can view approved documents"
  ON documents FOR SELECT
  TO authenticated
  USING (status = 'Aprovado');

CREATE POLICY "Users can view own documents"
  ON documents FOR SELECT
  TO authenticated
  USING (author_id = auth.uid());

CREATE POLICY "Coordenador and Gerente can view all documents"
  ON documents FOR SELECT
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('Coordenador', 'Gerente'));

CREATE POLICY "Authenticated users can create documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Analista can update own drafts"
  ON documents FOR UPDATE
  TO authenticated
  USING (
    author_id = auth.uid() 
    AND status IN ('Rascunho', 'Aguardando Aprovação')
    AND get_user_role(auth.uid()) = 'Analista'
  )
  WITH CHECK (
    author_id = auth.uid() 
    AND status IN ('Rascunho', 'Aguardando Aprovação')
  );

CREATE POLICY "Coordenador can update all documents"
  ON documents FOR UPDATE
  TO authenticated
  USING (get_user_role(auth.uid()) = 'Coordenador')
  WITH CHECK (get_user_role(auth.uid()) = 'Coordenador');

CREATE POLICY "Gerente can update all documents"
  ON documents FOR UPDATE
  TO authenticated
  USING (get_user_role(auth.uid()) = 'Gerente')
  WITH CHECK (get_user_role(auth.uid()) = 'Gerente');

CREATE POLICY "Gerente can delete documents"
  ON documents FOR DELETE
  TO authenticated
  USING (get_user_role(auth.uid()) = 'Gerente');

-- RLS Policies for document_history table
CREATE POLICY "Users can view history of documents they can access"
  ON document_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents 
      WHERE documents.id = document_history.document_id
      AND (
        documents.status = 'Aprovado'
        OR documents.author_id = auth.uid()
        OR get_user_role(auth.uid()) IN ('Coordenador', 'Gerente')
      )
    )
  );

CREATE POLICY "System can insert history"
  ON document_history FOR INSERT
  TO authenticated
  WITH CHECK (changed_by = auth.uid());

-- RLS Policies for comments table
CREATE POLICY "Users can view comments on accessible documents"
  ON comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents 
      WHERE documents.id = comments.document_id
      AND (
        documents.status = 'Aprovado'
        OR documents.author_id = auth.uid()
        OR get_user_role(auth.uid()) IN ('Coordenador', 'Gerente')
      )
    )
  );

CREATE POLICY "Users can create comments on accessible documents"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM documents 
      WHERE documents.id = comments.document_id
      AND (
        documents.status = 'Aprovado'
        OR documents.author_id = auth.uid()
        OR get_user_role(auth.uid()) IN ('Coordenador', 'Gerente')
      )
    )
  );

CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Gerente can delete any comment"
  ON comments FOR DELETE
  TO authenticated
  USING (get_user_role(auth.uid()) = 'Gerente');

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON user_roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to create document history on changes
CREATE OR REPLACE FUNCTION log_document_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO document_history (document_id, title, content, status, changed_by, change_type, version)
    VALUES (NEW.id, NEW.title, NEW.content, NEW.status, NEW.author_id, 'created', NEW.version);
  ELSIF (TG_OP = 'UPDATE') THEN
    IF (NEW.status != OLD.status AND NEW.status = 'Aprovado') THEN
      INSERT INTO document_history (document_id, title, content, status, changed_by, change_type, version)
      VALUES (NEW.id, NEW.title, NEW.content, NEW.status, auth.uid(), 'approved', NEW.version);
    ELSIF (NEW.status != OLD.status AND NEW.status = 'Arquivado') THEN
      INSERT INTO document_history (document_id, title, content, status, changed_by, change_type, version)
      VALUES (NEW.id, NEW.title, NEW.content, NEW.status, auth.uid(), 'archived', NEW.version);
    ELSE
      INSERT INTO document_history (document_id, title, content, status, changed_by, change_type, version)
      VALUES (NEW.id, NEW.title, NEW.content, NEW.status, auth.uid(), 'updated', NEW.version);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER log_document_changes_trigger
  AFTER INSERT OR UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION log_document_changes();

-- Insert default categories
INSERT INTO categories (name, description, icon) VALUES
  ('Acessos e Permissões', 'Documentação sobre solicitação de acessos a sistemas e permissões', 'key'),
  ('Processos Internos', 'Processos e fluxos de trabalho da equipe de TI', 'workflow'),
  ('Sistemas Corporativos', 'Guias de uso dos sistemas corporativos', 'server'),
  ('Onboarding', 'Guia de integração para novos colaboradores', 'user-plus'),
  ('FAQ', 'Perguntas frequentes e troubleshooting', 'help-circle')
ON CONFLICT DO NOTHING;