/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
type DocumentsTable = Database['public']['Tables']['documents'];
type Document = DocumentsTable['Row'];
type DocumentInsert = DocumentsTable['Insert'];
type DocumentUpdate = DocumentsTable['Update'];

export type DocumentWithCategory = Document & {
  categories: { name: string } | null;
};

const PAGE_SIZE = 20;

export interface DocumentFilters {
  searchTerm: string;
  status: string;
  page: number;
}

export async function fetchDocuments({ searchTerm, status, page }: DocumentFilters) {
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from('documents')
    .select('*, categories (name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (searchTerm) {
    query = query.ilike('title', `%${searchTerm}%`);
  }

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error, count } = await query;

  return {
    data: (data as DocumentWithCategory[]) ?? [],
    error,
    total: count ?? 0,
    pageSize: PAGE_SIZE,
  };
}

export async function fetchDashboardStats(userId?: string) {
  const [total, approved, pending] = await Promise.all([
    supabase
      .from('documents')
      .select('id', { count: 'exact', head: true }),
    supabase
      .from('documents')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'Aprovado'),
    supabase
      .from('documents')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'Aguardando Aprovação'),
  ]);

  let draftsCount = 0;
  let draftsError: unknown = null;

  if (userId) {
    const drafts = await supabase
      .from('documents')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'Rascunho')
      .eq('author_id', userId);

    draftsCount = drafts.count ?? 0;
    draftsError = drafts.error ?? null;
  }

  return {
    totalDocuments: total.count ?? 0,
    approvedDocuments: approved.count ?? 0,
    pendingApprovals: pending.count ?? 0,
    myDrafts: draftsCount,
    error: total.error || approved.error || pending.error || draftsError || null,
  };
}

export async function createDocument(payload: DocumentInsert) {
  const documentsTable = supabase.from('documents') as any;
  return documentsTable.insert(payload).select().single();
}

export async function updateDocument(documentId: string, payload: DocumentUpdate) {
  const documentsTable = supabase.from('documents') as any;
  return documentsTable.update(payload).eq('id', documentId);
}

export async function submitDocumentForApproval(documentId: string) {
  const documentsTable = supabase.from('documents') as any;
  return documentsTable.update({ status: 'Aguardando Aprovação' }).eq('id', documentId);
}

export async function approveDocument(documentId: string, userId: string) {
  const documentsTable = supabase.from('documents') as any;
  return documentsTable
    .update({
      status: 'Aprovado',
      approved_by: userId,
      approved_at: new Date().toISOString(),
    })
    .eq('id', documentId);
}

export async function deleteDocument(documentId: string) {
  const documentsTable = supabase.from('documents') as any;
  return documentsTable.delete().eq('id', documentId);
}
