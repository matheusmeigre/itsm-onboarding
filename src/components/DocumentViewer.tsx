import { useState } from 'react';
import { X, Clock, Edit, FileText, Tag } from 'lucide-react';
import { getUserPermissions } from '../lib/permissions';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../lib/database.types';
import { DocumentHistoryModal } from './DocumentHistoryModal';

type Document = Database['public']['Tables']['documents']['Row'];

interface DocumentViewerProps {
  document: Document & { categories?: { name: string } | null };
  onClose: () => void;
  onEdit: () => void;
}

export function DocumentViewer({ document, onClose, onEdit }: DocumentViewerProps) {
  const { profile } = useAuth();
  const [showHistory, setShowHistory] = useState(false);
  const permissions = getUserPermissions(profile?.role || null);

  const canEditDoc = permissions.canEdit || profile?.role === 'Coordenador' || profile?.role === 'Gerente';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Rascunho':
        return 'bg-gray-100 text-gray-800';
      case 'Aguardando Aprovação':
        return 'bg-yellow-100 text-yellow-800';
      case 'Aprovado':
        return 'bg-green-100 text-green-800';
      case 'Arquivado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-scaleIn">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <FileText className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">{document.title}</h2>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(document.status)}`}>
                  {document.status}
                </span>
                {document.categories && (
                  <span className="flex items-center space-x-1 text-sm text-gray-600">
                    <Tag className="w-4 h-4" />
                    <span>{document.categories.name}</span>
                  </span>
                )}
                <span className="text-sm text-gray-600">Versão {document.version}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 smooth-transition p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="prose max-w-none">
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed">
                  {document.content}
                </pre>
              </div>
            </div>

            {/* Metadata */}
            <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Informações do Documento</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Status:</span>
                  <span className="ml-2 font-medium text-gray-900">{document.status}</span>
                </div>
                <div>
                  <span className="text-gray-600">Versão:</span>
                  <span className="ml-2 font-medium text-gray-900">{document.version}</span>
                </div>
                <div className="flex items-center justify-between md:col-span-2">
                  <div>
                    <span className="text-gray-600">Criado em:</span>
                    <span className="ml-2 font-medium text-gray-900">{formatDate(document.created_at)}</span>
                  </div>
                  <button
                    onClick={() => setShowHistory(true)}
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors px-3 py-1 hover:bg-blue-100 rounded-lg"
                    title="Ver histórico de alterações"
                  >
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-medium">Histórico</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
            >
              Fechar
            </button>

            {canEditDoc && (
              <button
                onClick={onEdit}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg smooth-transition hover-lift font-medium"
              >
                <Edit className="w-5 h-5" />
                <span>Alterar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* History Modal */}
      <DocumentHistoryModal
        documentId={document.id}
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />
    </>
  );
}
