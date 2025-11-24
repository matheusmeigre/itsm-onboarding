import { useEffect, useState } from 'react';
import { Plus, Search, FileText, Clock, CheckCircle, Archive } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getUserPermissions, getDocumentStatusColor } from '../lib/permissions';
import type { Database } from '../lib/database.types';

type Document = Database['public']['Tables']['documents']['Row'];

interface DocumentWithCategory extends Document {
  categories: { name: string } | null;
}

interface DocumentListProps {
  onSelectDocument: (doc: Document | null) => void;
}

export function DocumentList({ onSelectDocument }: DocumentListProps) {
  const { profile } = useAuth();
  const [documents, setDocuments] = useState<DocumentWithCategory[]>([]);
  const [filteredDocs, setFilteredDocs] = useState<DocumentWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const permissions = getUserPermissions(profile?.role || null);

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    filterDocuments();
  }, [documents, searchTerm, statusFilter]);

  const loadDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          categories (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterDocuments = () => {
    let filtered = documents;

    if (searchTerm) {
      filtered = filtered.filter(doc =>
        doc.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(doc => doc.status === statusFilter);
    }

    setFilteredDocs(filtered);
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando documentos...</div>
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
              onClick={() => onSelectDocument(null)}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Novo Documento</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {filteredDocs.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum documento encontrado</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                onClick={() => onSelectDocument(doc)}
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
    </div>
  );
}
