import { ReactNode, useState } from 'react';
import { LogOut, Menu, X, FileText, Users, Settings, Home } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUserPermissions } from '../lib/permissions';

interface LayoutProps {
  children: ReactNode;
  currentView: 'documents' | 'admin' | 'dashboard';
  onNavigate: (view: 'documents' | 'admin' | 'dashboard') => void;
}

export function Layout({ children, currentView, onNavigate }: LayoutProps) {
  const { profile, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const permissions = getUserPermissions(profile?.role || null);

  const navigation = [
    { name: 'Início', icon: Home, view: 'dashboard' as const, show: true },
    { name: 'Documentos', icon: FileText, view: 'documents' as const, show: true },
    {
      name: 'Administração',
      icon: Settings,
      view: 'admin' as const,
      show: permissions.canManageUsers || permissions.canManageCategories
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="lg:flex">
        <div className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="bg-blue-600 p-2 rounded">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-gray-900">Doc Portal</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="p-4 space-y-1">
            {navigation.filter(item => item.show).map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.view;
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    onNavigate(item.view);
                    setSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors
                    ${isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </button>
              );
            })}
          </nav>

          <div className="absolute bottom-0 w-full p-4 border-t border-gray-200">
            <div className="mb-3">
              <div className="text-sm font-medium text-gray-900">{profile?.email}</div>
              {profile?.role && (
                <div className="text-xs text-gray-500 mt-1">
                  Função: {profile.role}
                </div>
              )}
            </div>
            <button
              onClick={signOut}
              className="w-full flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Sair</span>
            </button>
          </div>
        </div>

        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <div className="flex-1 flex flex-col min-h-screen">
          <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex-1 lg:ml-0">
              <h1 className="text-xl font-semibold text-gray-900">
                {currentView === 'dashboard' && 'Início'}
                {currentView === 'documents' && 'Documentos'}
                {currentView === 'admin' && 'Administração'}
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              {profile?.role && (
                <div className="hidden sm:block">
                  <span className={`
                    px-3 py-1 rounded-full text-xs font-medium
                    ${profile.role === 'Gerente' ? 'bg-red-100 text-red-800' : ''}
                    ${profile.role === 'Coordenador' ? 'bg-purple-100 text-purple-800' : ''}
                    ${profile.role === 'Analista' ? 'bg-blue-100 text-blue-800' : ''}
                  `}>
                    {profile.role}
                  </span>
                </div>
              )}
            </div>
          </header>

          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
