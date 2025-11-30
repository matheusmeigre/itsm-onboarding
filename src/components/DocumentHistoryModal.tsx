import { useEffect, useState } from 'react';
import { X, Clock, User, FileText, GitBranch, Circle } from 'lucide-react';
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
      // Buscar histórico do documento
      const { data: historyData, error: historyError } = await supabase
        .from('document_history')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: false });

      if (historyError) throw historyError;

      // Se não há histórico, buscar dados do documento para criar entrada de criação
      if (!historyData || historyData.length === 0) {
        const { data: docData, error: docError } = await supabase
          .from('documents')
          .select('*')
          .eq('id', documentId)
          .single();

        if (docError) throw docError;

        const doc = docData as any;
        if (doc) {
          const creationEntry: DocumentHistory = {
            id: 'creation',
            document_id: doc.id,
            title: doc.title,
            content: doc.content,
            status: doc.status,
            changed_by: doc.author_id,
            change_type: 'created',
            version: doc.version,
            changed_at: doc.created_at,
            user_email: 'Autor',
          };
          setHistory([creationEntry]);
        } else {
          setHistory([]);
        }
      } else {
        // Mapear histórico com tipo correto
        const mappedHistory: DocumentHistory[] = historyData.map((h: any) => ({
          id: h.id,
          document_id: h.document_id,
          title: h.title,
          content: h.content,
          status: h.status,
          changed_by: h.changed_by,
          change_type: h.change_type,
          version: h.version,
          changed_at: h.created_at || h.changed_at,
          user_email: 'Usuário',
        }));

        setHistory(mappedHistory);
      }
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
            <div className="relative">
              {/* Linha vertical de ramificação (estilo GitHub) */}
              <div className="absolute left-[13px] top-8 bottom-8 w-[2px] bg-gray-300"></div>
              
              {/* Lista de commits */}
              <div className="space-y-0">
                {history.map((entry, index) => (
                  <div
                    key={entry.id}
                    className="relative pl-10 pb-8 last:pb-0 animate-in fade-in slide-in-from-left-2"
                    style={{ animationDelay: `${index * 75}ms` }}
                  >
                    {/* Círculo do commit (nó da ramificação) */}
                    <div className={`absolute left-0 top-0 w-7 h-7 rounded-full border-2 border-gray-300 flex items-center justify-center ${
                      entry.change_type === 'created' ? 'bg-green-500' :
                      entry.change_type === 'updated' ? 'bg-blue-500' :
                      entry.change_type === 'approved' ? 'bg-purple-500' :
                      entry.change_type === 'status_changed' ? 'bg-yellow-500' :
                      'bg-gray-500'
                    }`}>
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>

                    {/* Card do commit */}
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:border-blue-400 hover:shadow-md transition-all duration-200">
                      {/* Header do commit */}
                      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 rounded-t-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getChangeTypeColor(entry.change_type)}`}>
                              {getChangeTypeLabel(entry.change_type)}
                            </span>
                            <span className="text-sm font-mono text-gray-600">
                              v{entry.version}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <User className="w-4 h-4" />
                            <span className="font-medium">{entry.user_email}</span>
                          </div>
                        </div>
                      </div>

                      {/* Corpo do commit */}
                      <div className="px-4 py-3">
                        <h4 className="font-semibold text-gray-900 mb-2">{entry.title}</h4>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{new Date(entry.changed_at).toLocaleString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="font-medium">Status:</span>
                            <span className={`px-2 py-0.5 rounded ${
                              entry.status === 'Aprovado' ? 'bg-green-100 text-green-800' :
                              entry.status === 'Aguardando Aprovação' ? 'bg-yellow-100 text-yellow-800' :
                              entry.status === 'Rascunho' ? 'bg-gray-100 text-gray-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {entry.status}
                            </span>
                          </div>
                        </div>

                        {/* Preview do conteúdo */}
                        <details className="group">
                          <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-700 font-medium list-none flex items-center space-x-1">
                            <span className="group-open:hidden">▶ Ver alterações</span>
                            <span className="hidden group-open:inline">▼ Ocultar alterações</span>
                          </summary>
                          <div className="mt-3 bg-gray-50 border border-gray-200 rounded p-3 text-sm">
                            <pre className="whitespace-pre-wrap font-mono text-xs text-gray-700 overflow-x-auto">
{entry.content.length > 500 ? `${entry.content.substring(0, 500)}...` : entry.content}
                            </pre>
                          </div>
                        </details>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
