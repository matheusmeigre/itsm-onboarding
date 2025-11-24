import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/LoginForm';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { DocumentList } from './components/DocumentList';
import { DocumentEditor } from './components/DocumentEditor';
import { AdminPanel } from './components/AdminPanel';
import type { Database } from './lib/database.types';

type Document = Database['public']['Tables']['documents']['Row'];

function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<'documents' | 'admin' | 'dashboard'>('dashboard');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const handleSelectDocument = (doc: Document | null) => {
    setSelectedDocument(doc);
    setShowEditor(true);
  };

  const handleCloseEditor = () => {
    setShowEditor(false);
    setSelectedDocument(null);
  };

  const handleSaveDocument = () => {
    setShowEditor(false);
    setSelectedDocument(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
    <Layout currentView={currentView} onNavigate={setCurrentView}>
      {currentView === 'dashboard' && <Dashboard />}
      {currentView === 'documents' && (
        <DocumentList onSelectDocument={handleSelectDocument} />
      )}
      {currentView === 'admin' && <AdminPanel />}

      {showEditor && (
        <DocumentEditor
          document={selectedDocument}
          onClose={handleCloseEditor}
          onSave={handleSaveDocument}
        />
      )}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
