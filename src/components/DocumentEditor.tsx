import { useEffect, useState } from 'react';
import { Save, X, Check, Trash2, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { canEditDocument, canApproveDocument, canDeleteDocument } from '../lib/permissions';
import type { Database } from '../lib/database.types';
import { sanitizeRichContent, sanitizeText } from '../lib/sanitize';
import { validateDocumentPayload } from '../lib/validators';
import {
  createDocument,
  updateDocument as updateDocumentService,
  submitDocumentForApproval,
  approveDocument as approveDocumentService,
  deleteDocument as deleteDocumentService,
} from '../services/documentService';

type Document = Database['public']['Tables']['documents']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

interface DocumentEditorProps {
  document: Document | null;
  onClose: () => void;
  onSave: () => void;
}

export function DocumentEditor({ document, onClose, onSave }: DocumentEditorProps) {
  const { profile } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [status, setStatus] = useState<Database['public']['Tables']['documents']['Row']['status']>('Rascunho');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isNewDocument = !document;
  const isAuthor = document?.author_id === profile?.id;
  const canEdit = isNewDocument || canEditDocument(profile?.role || null, document?.status || 'Rascunho', isAuthor);
  const canApprove = !isNewDocument && canApproveDocument(profile?.role || null, document?.status || 'Rascunho', null);
  const canDelete = !isNewDocument && canDeleteDocument(profile?.role || null);

  useEffect(() => {
    loadCategories();
    if (document) {
      setTitle(document.title);
      setContent(document.content);
      setCategoryId(document.category_id || '');
      setStatus(document.status);
    }
  }, [document]);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleSave = async () => {
    if (!profile?.id) {
      setError('Perfil do usuário não encontrado');
      return;
    }

    const sanitizedTitle = sanitizeText(title);
    const sanitizedContent = sanitizeRichContent(content);
    const desiredStatus = isNewDocument
      ? profile.role === 'Gerente'
        ? 'Aprovado'
        : 'Rascunho'
      : status;

    const validation = validateDocumentPayload({
      title: sanitizedTitle,
      content: sanitizedContent,
      category_id: categoryId ? categoryId : null,
      status: desiredStatus,
    });

    if (!validation.success) {
      const issues = validation.error.issues;
      setError(issues[0]?.message || 'Dados inválidos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isNewDocument) {
        const { error } = await createDocument({
          title: validation.data.title,
          content: validation.data.content,
          category_id: validation.data.category_id ?? null,
          status: validation.data.status,
          author_id: profile.id,
        });

        if (error) {
          throw error;
        }
      } else {
        const { error } = await updateDocumentService(document.id, {
          title: validation.data.title,
          content: validation.data.content,
          category_id: validation.data.category_id ?? null,
          status: validation.data.status,
        });

        if (error) {
          throw error;
        }
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving document:', error);
      setError((error as Error).message || 'Erro ao salvar documento');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForApproval = async () => {
    setLoading(true);
    setError('');

    try {
      const { error } = await submitDocumentForApproval(document!.id);

      if (error) {
        throw error;
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error submitting for approval:', error);
      setError((error as Error).message || 'Erro ao enviar para aprovação');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!profile?.id) {
      setError('Perfil do usuário não encontrado');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error } = await approveDocumentService(document!.id, profile.id);

      if (error) {
        throw error;
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error approving document:', error);
      setError((error as Error).message || 'Erro ao aprovar documento');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este documento?')) return;

    setLoading(true);
    setError('');

    try {
      const { error } = await deleteDocumentService(document!.id);

      if (error) {
        throw error;
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error deleting document:', error);
      setError((error as Error).message || 'Erro ao excluir documento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isNewDocument ? 'Novo Documento' : 'Editar Documento'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Título do Documento
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!canEdit}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              placeholder="Digite o título do documento"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Categoria
            </label>
            <select
              id="category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={!canEdit}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            >
              <option value="">Selecione uma categoria</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              Conteúdo
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={!canEdit}
              rows={12}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 font-mono text-sm"
              placeholder="Digite o conteúdo do documento (suporta Markdown)"
            />
          </div>

          {!isNewDocument && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 space-y-1">
                <div>Status: <span className="font-medium">{status}</span></div>
                <div>Versão: <span className="font-medium">{document?.version}</span></div>
                <div>Criado em: <span className="font-medium">
                  {new Date(document?.created_at || '').toLocaleString('pt-BR')}
                </span></div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div>
            {canDelete && (
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex items-center space-x-2 text-red-600 hover:text-red-700 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-5 h-5" />
                <span>Excluir</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>

            {!isNewDocument && isAuthor && status === 'Rascunho' && (
              <button
                onClick={handleSubmitForApproval}
                disabled={loading}
                className="flex items-center space-x-2 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                <Clock className="w-5 h-5" />
                <span>Enviar para Aprovação</span>
              </button>
            )}

            {canApprove && status === 'Aguardando Aprovação' && (
              <button
                onClick={handleApprove}
                disabled={loading}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                <Check className="w-5 h-5" />
                <span>Aprovar</span>
              </button>
            )}

            {canEdit && (
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                <span>{loading ? 'Salvando...' : 'Salvar'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
