export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRoleType = 'Analista' | 'Coordenador' | 'Gerente';
export type DocumentStatusType = 'Rascunho' | 'Aguardando Aprovação' | 'Aprovado' | 'Arquivado';
export type ChangeType = 'created' | 'updated' | 'approved' | 'archived' | 'restored';

export interface Database {
  public: {
    Tables: {
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: UserRoleType;
          assigned_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role?: UserRoleType;
          assigned_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: UserRoleType;
          assigned_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          description: string;
          parent_id: string | null;
          icon: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          parent_id?: string | null;
          icon?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          parent_id?: string | null;
          icon?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          title: string;
          content: string;
          status: DocumentStatusType;
          category_id: string | null;
          author_id: string;
          approved_by: string | null;
          approved_at: string | null;
          version: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          content?: string;
          status?: DocumentStatusType;
          category_id?: string | null;
          author_id: string;
          approved_by?: string | null;
          approved_at?: string | null;
          version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          status?: DocumentStatusType;
          category_id?: string | null;
          author_id?: string;
          approved_by?: string | null;
          approved_at?: string | null;
          version?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      document_history: {
        Row: {
          id: string;
          document_id: string;
          title: string;
          content: string;
          status: DocumentStatusType;
          changed_by: string;
          change_type: ChangeType;
          version: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          title: string;
          content: string;
          status: DocumentStatusType;
          changed_by: string;
          change_type: ChangeType;
          version: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          title?: string;
          content?: string;
          status?: DocumentStatusType;
          changed_by?: string;
          change_type?: ChangeType;
          version?: number;
          created_at?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          document_id: string;
          user_id: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          user_id: string;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          user_id?: string;
          content?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Functions: {
      get_user_role: {
        Args: { user_uuid: string };
        Returns: UserRoleType;
      };
    };
  };
}
