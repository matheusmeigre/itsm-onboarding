import { ReactNode, useState, useEffect } from 'react';
import { LogOut, Menu, X, FileText, Settings, Home, User } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserPermissions } from '../lib/permissions';
import { supabase } from '../lib/supabase';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { profile, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string>('bg-gray-400');
  const location = useLocation();
  const permissions = getUserPermissions(profile?.role || null);

  useEffect(() => {
    loadUserAvatar();
  }, [profile?.id]);

  useEffect(() => {
    // Escuta evento de atualização de perfil
    const handleProfileUpdate = () => {
      loadUserAvatar();
    };
    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => window.removeEventListener('profileUpdated', handleProfileUpdate);
  }, []);

  const loadUserAvatar = async () => {
    if (!profile?.id) return;

    try {
      const { data } = await supabase
        .from('profiles')
        .select('avatar')
        .eq('id', profile.id)
        .single();

      if (data?.avatar) {
        setUserAvatar(data.avatar);
      }
    } catch (err) {
      console.error('Error loading avatar:', err);
    }
  };

  // Função para renderizar avatar circular com silhueta
  const renderAvatar = (color: string, size: 'sm' | 'md' = 'md') => {
    const sizeClasses = size === 'md' ? 'w-10 h-10' : 'w-8 h-8';
    return (
      <div className={`${sizeClasses} ${color} rounded-full flex items-center justify-center relative overflow-hidden shadow-md smooth-transition group-hover:scale-110 flex-shrink-0`}>
        <div className="absolute inset-0 flex items-end justify-center">
          <div className="relative w-full h-full flex items-end justify-center">
            <div className="absolute" style={{ top: '20%', left: '50%', transform: 'translateX(-50%)', width: '35%', height: '35%' }}>
              <div className="w-full h-full bg-white/90 rounded-full"></div>
            </div>
            <div className="absolute" style={{ bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '70%', height: '50%' }}>
              <div className="w-full h-full bg-white/90 rounded-t-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Função para obter cor do texto baseada no role
  const getRoleTextColor = (role: string | null) => {
    switch (role) {
      case 'Gerente':
        return 'text-red-600';
      case 'Coordenador':
        return 'text-purple-600';
      case 'Analista':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const navigation = [
    { name: 'Início', icon: Home, path: '/', show: true },
    { name: 'Documentos', icon: FileText, path: '/documentos', show: true },
    {
      name: 'Administração',
      icon: Settings,
      path: '/administracao',
      show: permissions.canManageUsers || permissions.canManageCategories
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="lg:flex">
        <div className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform smooth-transition lg:translate-x-0 lg:static lg:inset-0
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

          <nav className="p-4 space-y-1" role="navigation" aria-label="Menu principal">
            {navigation.filter(item => item.show).map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) => `
                    w-full flex items-center space-x-3 px-4 py-3 rounded-lg smooth-transition
                    ${isActive
                      ? 'bg-blue-50 text-blue-700 shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50 hover:translate-x-1'
                    }
                  `}
                  aria-label={`Navegar para ${item.name}`}
                >
                  <Icon className="w-5 h-5" aria-hidden="true" />
                  <span className="font-medium">{item.name}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="absolute bottom-0 w-full p-4 border-t border-gray-200 space-y-2">
            <NavLink
              to="/perfil"
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `
                group w-full flex items-center space-x-3 px-4 py-3 rounded-lg smooth-transition
                ${isActive
                  ? 'bg-blue-50 text-blue-700 shadow-sm'
                  : 'text-gray-700 hover:bg-gray-50 hover-lift'
                }
              `}
            >
              {renderAvatar(userAvatar, 'sm')}
              <div className="flex-1 text-left min-w-0">
                <div className="text-xs font-semibold text-gray-500 uppercase">Meu Perfil</div>
                <div className={`text-sm font-bold ${getRoleTextColor(profile?.role || null)}`}>{profile?.role || 'Usuário'}</div>
                <div className="text-xs text-gray-500 truncate">{profile?.email}</div>
              </div>
            </NavLink>
            <button
              onClick={signOut}
              className="w-full flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg smooth-transition hover-lift"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sair</span>
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
              aria-label="Abrir menu lateral"
            >
              <Menu className="w-6 h-6" aria-hidden="true" />
            </button>

            <div className="flex-1 lg:ml-0">
              <h1 className="text-xl font-semibold text-gray-900">
                {location.pathname === '/' && 'Início'}
                {location.pathname === '/documentos' && 'Documentos'}
                {location.pathname === '/administracao' && 'Administração'}
                {location.pathname === '/perfil' && 'Meu Perfil'}
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <NavLink
                to="/perfil"
                className="hidden sm:flex items-center justify-center smooth-transition hover-lift group"
                title="Meu Perfil"
              >
                {renderAvatar(userAvatar, 'md')}
              </NavLink>
            </div>
          </header>

          <main className="flex-1 p-6" role="main">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
