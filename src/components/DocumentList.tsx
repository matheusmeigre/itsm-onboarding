import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, FileText, Clock, CheckCircle, Archive, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUserPermissions, getDocumentStatusColor } from '../lib/permissions';
import { useDocuments } from '../hooks/useDocuments';
import type { DocumentWithCategory } from '../services/documentService';
import type { Database } from '../lib/database.types';

type Document = Database['public']['Tables']['documents']['Row'];

interface DocumentListProps {
  onSelectDocument: (doc: Document | null) => void;
  refreshToken: number;
}

export function DocumentList({ onSelectDocument, refreshToken }: DocumentListProps) {
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const permissions = getUserPermissions(profile?.role || null);

  useEffect(() => {
    setPage(0);
  }, [searchTerm, statusFilter]);

  const filters = useMemo(
    () => ({ searchTerm, status: statusFilter, page }),
    [searchTerm, statusFilter, page],
  );

  const { documents, total, pageSize, loading, error, reload } = useDocuments(filters, refreshToken);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    if (page > totalPages - 1) {
      setPage(Math.max(totalPages - 1, 0));
    }
  }, [page, totalPages]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Rascunho':
        return <FileText className="w-4 h-4" />;
      case 'Aguardando Aprovação':
        return <Clock className="w-4 h-4" />;
      case 'Aprovado':
        return <CheckCircle className="w-4 h-4" />;
      case 'Arquivado':
        return <Archive className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const handleOpenEditor = (doc: DocumentWithCategory | null) => {
    onSelectDocument(doc);
  };

  const handlePreviousPage = () => {
    setPage((prev) => Math.max(prev - 1, 0));
  };

  const handleNextPage = () => {
    setPage((prev) => Math.min(prev + 1, totalPages - 1));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando documentos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4 text-center">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <div className="text-red-600 font-medium">{error}</div>
        <button
          onClick={() => reload()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar documentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos os Status</option>
            <option value="Rascunho">Rascunho</option>
            <option value="Aguardando Aprovação">Aguardando Aprovação</option>
            <option value="Aprovado">Aprovado</option>
            <option value="Arquivado">Arquivado</option>
          </select>

          {permissions.canCreate && (
            <button
              onClick={() => handleOpenEditor(null)}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Novo Documento</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {documents.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum documento encontrado</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {documents.map((doc) => (
              <div
                key={doc.id}
                onClick={() => handleOpenEditor(doc)}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {doc.title}
                      </h3>
                      <span className={`
                        flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium
                        ${getDocumentStatusColor(doc.status)}
                      `}>
                        {getStatusIcon(doc.status)}
                        <span>{doc.status}</span>
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      {doc.categories && (
                        <span className="flex items-center space-x-1">
                          <FileText className="w-4 h-4" />
                          <span>{doc.categories.name}</span>
                        </span>
                      )}
                      <span>
                        Versão {doc.version}
                      </span>
                      <span>
                        {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600">
            Página {page + 1} de {totalPages} • {total} documentos
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePreviousPage}
              disabled={page === 0}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={handleNextPage}
              disabled={page + 1 >= totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
