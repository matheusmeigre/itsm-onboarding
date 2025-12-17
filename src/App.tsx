import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/LoginForm';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { DocumentList } from './components/DocumentList';
import { DocumentEditor } from './components/DocumentEditor';
import { DocumentViewer } from './components/DocumentViewer';
import { AdminPanel } from './components/AdminPanel';
import { UserManagement } from './components/UserManagement';
import { UserProfile } from './components/UserProfile';
import { ProtectedRoute } from './components/ProtectedRoute';
import { NotFound } from './components/NotFound';
import type { Database } from './lib/database.types';

type Document = Database['public']['Tables']['documents']['Row'];

function AppContent() {
  const { user, loading } = useAuth();
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showViewer, setShowViewer] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [documentsRefreshToken, setDocumentsRefreshToken] = useState(0);

  const handleSelectDocument = (doc: Document | null) => {
    setSelectedDocument(doc);
    if (doc) {
      setShowViewer(true); // Abrir em modo leitura primeiro
    } else {
      setShowEditor(true); // Novo documento vai direto para editor
    }
  };

  const handleEditFromViewer = () => {
    setShowViewer(false);
    setShowEditor(true);
  };

  const handleCloseViewer = () => {
    setShowViewer(false);
    setSelectedDocument(null);
  };

  const handleCloseEditor = () => {
    setShowEditor(false);
    setSelectedDocument(null);
  };

  const handleSaveDocument = () => {
    setShowEditor(false);
    setSelectedDocument(null);
    setDocumentsRefreshToken((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/documentos"
        element={
          <ProtectedRoute>
            <Layout>
              <DocumentList
                onSelectDocument={handleSelectDocument}
                refreshToken={documentsRefreshToken}
                statusFilter="all"
              />
              {showViewer && selectedDocument && (
                <DocumentViewer
                  document={selectedDocument as any}
                  onClose={handleCloseViewer}
                  onEdit={handleEditFromViewer}
                />
              )}
              {showEditor && (
                <DocumentEditor
                  document={selectedDocument}
                  onClose={handleCloseEditor}
                  onSave={handleSaveDocument}
                />
              )}
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/documentos-aprovados"
        element={
          <ProtectedRoute>
            <Layout>
              <DocumentList
                onSelectDocument={handleSelectDocument}
                refreshToken={documentsRefreshToken}
                statusFilter="Aprovado"
              />
              {showViewer && selectedDocument && (
                <DocumentViewer
                  document={selectedDocument as any}
                  onClose={handleCloseViewer}
                  onEdit={handleEditFromViewer}
                />
              )}
              {showEditor && (
                <DocumentEditor
                  document={selectedDocument}
                  onClose={handleCloseEditor}
                  onSave={handleSaveDocument}
                />
              )}
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/aguardando-aprovacao"
        element={
          <ProtectedRoute>
            <Layout>
              <DocumentList
                onSelectDocument={handleSelectDocument}
                refreshToken={documentsRefreshToken}
                statusFilter="Aguardando Aprovação"
              />
              {showViewer && selectedDocument && (
                <DocumentViewer
                  document={selectedDocument as any}
                  onClose={handleCloseViewer}
                  onEdit={handleEditFromViewer}
                />
              )}
              {showEditor && (
                <DocumentEditor
                  document={selectedDocument}
                  onClose={handleCloseEditor}
                  onSave={handleSaveDocument}
                />
              )}
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/meus-rascunhos"
        element={
          <ProtectedRoute>
            <Layout>
              <DocumentList
                onSelectDocument={handleSelectDocument}
                refreshToken={documentsRefreshToken}
                statusFilter="Rascunho"
                myDocumentsOnly={true}
              />
              {showViewer && selectedDocument && (
                <DocumentViewer
                  document={selectedDocument as any}
                  onClose={handleCloseViewer}
                  onEdit={handleEditFromViewer}
                />
              )}
              {showEditor && (
                <DocumentEditor
                  document={selectedDocument}
                  onClose={handleCloseEditor}
                  onSave={handleSaveDocument}
                />
              )}
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/administracao"
        element={
          <ProtectedRoute requiredRoles={["Gerente", "Coordenador"]}>
            <Layout>
              <AdminPanel />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/gerenciar-usuarios"
        element={
          <ProtectedRoute requiredRoles={["Gerente"]}>
            <Layout>
              <UserManagement />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/perfil"
        element={
          <ProtectedRoute>
            <Layout>
              <UserProfile />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AppContent;
