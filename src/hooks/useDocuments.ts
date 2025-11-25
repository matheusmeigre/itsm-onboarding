import { useCallback, useEffect, useState } from 'react';
import { fetchDocuments, type DocumentFilters, type DocumentWithCategory } from '../services/documentService';

interface UseDocumentsState {
  documents: DocumentWithCategory[];
  total: number;
  pageSize: number;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useDocuments(filters: DocumentFilters, refreshToken = 0): UseDocumentsState {
  const [documents, setDocuments] = useState<DocumentWithCategory[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError, total: count, pageSize: size } = await fetchDocuments(filters);
      if (fetchError) {
        throw fetchError;
      }

      setDocuments(data);
      setTotal(count);
      setPageSize(size);
    } catch (err) {
      console.error('Failed to load documents', err);
      setError('Não foi possível carregar os documentos');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments, refreshToken]);

  return {
    documents,
    total,
    pageSize,
    loading,
    error,
    reload: loadDocuments,
  };
}
