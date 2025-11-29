import { useEffect, useState } from 'react';
import { X, Clock, User, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';

type DocumentHistory = {
  id: string;
  document_id: string;
  title: string;
  content: string;
  status: string;
  changed_by: string;
  change_type: string;
  version: number;
  changed_at: string;
  user_email?: string;
};

interface DocumentHistoryModalProps {
  documentId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentHistoryModal({ documentId, isOpen, onClose }: DocumentHistoryModalProps) {
  const [history, setHistory] = useState<DocumentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && documentId) {
      loadHistory();
    }
  }, [isOpen, documentId]);

  const loadHistory = async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error: fetchError } = await supabase
        .from('document_history')
        .select('*')
        .eq('document_id', documentId)
        .order('changed_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Mapear histórico com tipo correto
      const historyData = (data as any[]) || [];
      const historyWithEmails: DocumentHistory[] = historyData.map((h: any) => ({
        id: h.id,
        document_id: h.document_id,
        title: h.title,
        content: h.content,
        status: h.status,
        changed_by: h.changed_by,
        change_type: h.change_type,
        version: h.version,
        changed_at: h.changed_at,
        user_email: 'Usuário',
      }));

      setHistory(historyWithEmails);
    } catch (err) {
      console.error('Error loading document history:', err);
      setError('Erro ao carregar histórico do documento');
    } finally {
      setLoading(false);
    }
  };

  const getChangeTypeLabel = (changeType: string) => {
    switch (changeType) {
      case 'created':
        return 'Criado';
      case 'updated':
        return 'Atualizado';
      case 'status_changed':
        return 'Status Alterado';
      case 'approved':
        return 'Aprovado';
      default:
        return changeType;
    }
  };

  const getChangeTypeColor = (changeType: string) => {
    switch (changeType) {
      case 'created':
        return 'bg-green-100 text-green-800';
      case 'updated':
        return 'bg-blue-100 text-blue-800';
      case 'status_changed':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Histórico de Alterações</h2>
              <p className="text-sm text-gray-600">Todas as modificações do documento</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Carregando histórico...</div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma alteração registrada</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((entry, index) => (
                <div
                  key={entry.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-all duration-200 animate-in fade-in slide-in-from-bottom-2"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Header da entrada */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getChangeTypeColor(entry.change_type)}`}>
                        {getChangeTypeLabel(entry.change_type)}
                      </span>
                      <span className="text-sm font-medium text-gray-700">
                        Versão {entry.version}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600 flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(entry.changed_at).toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="text-xs text-gray-500 flex items-center space-x-1 mt-1">
                        <User className="w-3 h-3" />
                        <span>{entry.user_email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Detalhes da mudança */}
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase">Título:</span>
                      <p className="text-sm text-gray-900 mt-1">{entry.title}</p>
                    </div>
                    
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase">Status:</span>
                      <p className="text-sm text-gray-900 mt-1">{entry.status}</p>
                    </div>

                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase">Conteúdo:</span>
                      <div className="text-sm text-gray-700 mt-1 bg-gray-50 p-3 rounded border border-gray-200 max-h-32 overflow-y-auto">
                        <pre className="whitespace-pre-wrap font-sans">{entry.content.substring(0, 200)}...</pre>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors font-medium"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
