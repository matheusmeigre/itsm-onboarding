import { useCallback, useEffect, useState } from 'react';
import { Users, UserPlus, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUserPermissions, getRoleBadgeColor } from '../lib/permissions';
import type { UserRoleType } from '../lib/database.types';
import {
  createAdminUser,
  listAdminUsers,
  updateAdminUserRole,
  type AdminUser,
} from '../services/adminService';

export function AdminPanel() {
  const { profile, session } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRoleType>('Analista');
  const [error, setError] = useState('');
  const permissions = getUserPermissions(profile?.role || null);

  const token = session?.access_token || '';

  const loadUsers = useCallback(async () => {
    if (!token) {
      setError('Sessão expirada. Faça login novamente.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { users } = await listAdminUsers(token);
      setUsers(users);
    } catch (err) {
      console.error('Error loading users:', err);
      setError((err as Error).message || 'Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (permissions.canManageUsers) {
      loadUsers();
    }
  }, [permissions, loadUsers]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!token) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      await createAdminUser(token, {
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
      });

      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('Analista');
      setShowAddUser(false);
      await loadUsers();
    } catch (error) {
      console.error('Error adding user:', error);
      setError((error as Error).message || 'Erro ao adicionar usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: UserRoleType) => {
    setLoading(true);
    setError('');

    try {
      if (!token) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      await updateAdminUserRole(token, userId, newRole);

      await loadUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      setError((error as Error).message || 'Erro ao atualizar função');
    } finally {
      setLoading(false);
    }
  };

  if (!permissions.canManageUsers) {
    return (
      <div className="text-center py-12">
        <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Você não tem permissão para acessar esta área</p>
      </div>
    );
  }

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando usuários...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gerenciamento de Usuários</h2>
          <p className="text-gray-600 mt-1">Gerencie usuários e suas permissões no sistema</p>
        </div>
        <button
          onClick={() => setShowAddUser(true)}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <UserPlus className="w-5 h-5" />
          <span>Adicionar Usuário</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Função
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Criado em
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.role ? (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                      {user.role}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">Sem função</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.created_at).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <select
                    value={user.role || ''}
                    onChange={(e) => handleUpdateRole(user.id, e.target.value as UserRoleType)}
                    disabled={user.id === profile?.id}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  >
                    <option value="">Selecionar função</option>
                    <option value="Analista">Analista</option>
                    <option value="Coordenador">Coordenador</option>
                    <option value="Gerente">Gerente</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Adicionar Novo Usuário</h3>

            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="usuario@empresa.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Senha
                </label>
                <input
                  id="password"
                  type="password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                  Função
                </label>
                <select
                  id="role"
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as UserRoleType)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Analista">Analista</option>
                  <option value="Coordenador">Coordenador</option>
                  <option value="Gerente">Gerente</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddUser(false);
                    setNewUserEmail('');
                    setNewUserPassword('');
                    setNewUserRole('Analista');
                    setError('');
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? 'Adicionando...' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
