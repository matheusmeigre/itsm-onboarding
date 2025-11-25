import { useCallback, useEffect, useState } from 'react';
import { Users, UserPlus, Shield, Pencil, Trash2, Eye, AlertCircle } from 'lucide-react';
import { supabaseAdmin, isAdminAvailable } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getUserPermissions, getRoleBadgeColor } from '../lib/permissions';
import type { UserRoleType } from '../lib/database.types';
import type { User } from '@supabase/supabase-js';

interface UserWithRole {
  id: string;
  email: string;
  role: UserRoleType | null;
  role_id: string | null;
  created_at: string;
}

export function AdminPanel() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserWithRole | null>(null);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRoleType>('Analista');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<UserRoleType>('Analista');
  const [error, setError] = useState('');
  const permissions = getUserPermissions(profile?.role || null);

  const loadUsers = useCallback(async () => {
    if (!permissions.canViewUsers && !permissions.canManageUsers) {
      setError('Você não tem permissão para visualizar usuários');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Buscar usuários da tabela auth.users (requer RLS configurado)
      const { data: { users: authUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers();

      if (authError) {
        if (authError.message?.includes('not allowed') || authError.message?.includes('JWT')) {
          throw new Error('Service role key não configurada corretamente. Verifique se VITE_SUPABASE_SERVICE_ROLE_KEY está nas variáveis de ambiente do Bolt e faça redeploy.');
        }
        throw authError;
      }

      // Buscar roles da tabela user_roles
      const { data: roles, error: rolesError } = await supabaseAdmin
        .from('user_roles')
        .select('*') as { data: Array<{ id: string; user_id: string; role: UserRoleType }> | null; error: any };

      if (rolesError) throw rolesError;

      const usersWithRoles: UserWithRole[] = authUsers.map((user: User) => {
        const userRole = roles?.find((r) => r.user_id === user.id);
        return {
          id: user.id,
          email: user.email || '',
          role: userRole?.role || null,
          role_id: userRole?.id || null,
          created_at: user.created_at,
        };
      });

      setUsers(usersWithRoles);
    } catch (err) {
      console.error('Error loading users:', err);
      setError((err as Error).message || 'Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  }, [permissions.canViewUsers, permissions.canManageUsers]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Use admin createUser to avoid auto-login
      const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: newUserEmail,
        password: newUserPassword,
        email_confirm: true, // Auto-confirm email
      });

      if (createError) {
        if (createError.message?.includes('not allowed') || createError.message?.includes('JWT')) {
          throw new Error('Service role key não configurada corretamente. Verifique se VITE_SUPABASE_SERVICE_ROLE_KEY está nas variáveis de ambiente do Bolt e faça redeploy.');
        }
        throw createError;
      }

      if (userData.user) {
        const { error: roleError } = await supabaseAdmin.from('user_roles').insert({
          user_id: userData.user.id,
          role: newUserRole,
          assigned_by: profile!.id,
        } as any);

        if (roleError) throw roleError;
      }

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

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setError('');
    setLoading(true);

    try {
      // Update email if changed
      if (editEmail !== editingUser.email) {
        const { error: emailError } = await supabaseAdmin.auth.admin.updateUserById(
          editingUser.id,
          { email: editEmail }
        );
        if (emailError) throw emailError;
      }

      // Update role - use onConflict to handle existing records
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .upsert({
          user_id: editingUser.id,
          role: editRole,
          assigned_by: profile!.id,
        } as any, {
          onConflict: 'user_id'
        });

      if (roleError) throw roleError;

      setEditingUser(null);
      await loadUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      setError((error as Error).message || 'Erro ao atualizar usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    setError('');
    setLoading(true);

    try {
      console.log('🗑️ Iniciando deleção do usuário:', deletingUser.id);

      // Step 1: Delete user role first (if exists)
      console.log('📝 Deletando role do usuário...');
      const { error: roleError, data: roleData } = await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('user_id', deletingUser.id)
        .select();
      
      if (roleError) {
        console.error('⚠️ Erro ao deletar role (continuando):', roleError);
      } else {
        console.log('✅ Role deletada:', roleData);
      }

      // Step 2: Remove foreign key references that don't have CASCADE
      console.log('🔗 Removendo referências de foreign keys...');
      
      // Update documents where user is approved_by (no CASCADE)
      console.log('📄 Limpando approved_by em documents...');
      try {
        await (supabaseAdmin.rpc as any)('cleanup_user_references', { 
          target_user_id: deletingUser.id 
        });
        console.log('✅ Referências limpas via RPC');
      } catch (rpcError) {
        // Fallback: try direct update with proper casting
        console.log('⚠️ RPC não disponível, usando update direto...');
        
        const docsUpdate = await (supabaseAdmin
          .from('documents') as any)
          .update({ approved_by: null })
          .eq('approved_by', deletingUser.id);
        
        if (docsUpdate.error) {
          console.warn('⚠️ Erro ao limpar approved_by:', docsUpdate.error);
        }

        const rolesUpdate = await (supabaseAdmin
          .from('user_roles') as any)
          .update({ assigned_by: null })
          .eq('assigned_by', deletingUser.id);
        
        if (rolesUpdate.error) {
          console.warn('⚠️ Erro ao limpar assigned_by:', rolesUpdate.error);
        }
        
        console.log('✅ Referências limpas com updates diretos');
      }

      // Note: document_history.changed_by and documents.author_id will cascade delete
      // Comments will also cascade delete

      // Step 3: Delete user from auth (after all references cleaned)
      console.log('👤 Deletando usuário do auth...');
      const { data: deleteData, error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(deletingUser.id);
      
      if (deleteError) {
        console.error('❌ Erro ao deletar usuário do auth:', deleteError);
        throw new Error(`Erro ao deletar usuário: ${deleteError.message}`);
      }

      console.log('✅ Usuário deletado com sucesso:', deleteData);
      setDeletingUser(null);
      await loadUsers();
    } catch (error) {
      console.error('❌ Erro geral na deleção:', error);
      setError((error as Error).message || 'Erro ao excluir usuário');
    } finally {
      setLoading(false);
    }
  };

  if (!permissions.canViewUsers && !permissions.canManageUsers) {
    return (
      <div className="text-center py-12">
        <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Você não tem permissão para acessar esta área</p>
      </div>
    );
  }

  const isReadOnly = permissions.canViewUsers && !permissions.canEditUsers;

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
          <p className="text-gray-600 mt-1">
            {isReadOnly ? 'Visualize usuários e suas permissões no sistema' : 'Gerencie usuários e suas permissões no sistema'}
          </p>
        </div>
        {permissions.canManageUsers && (
          <button
            onClick={() => setShowAddUser(true)}
            disabled={!isAdminAvailable}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={!isAdminAvailable ? 'Configuração de admin necessária' : ''}
          >
            <UserPlus className="w-5 h-5" />
            <span>Adicionar Usuário</span>
          </button>
        )}
      </div>

      {!isAdminAvailable && permissions.canManageUsers && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-yellow-800 mb-1">
                Configuração de Administração Necessária
              </h3>
              <p className="text-sm text-yellow-700 mb-2">
                A variável de ambiente <code className="bg-yellow-100 px-1 rounded">VITE_SUPABASE_SERVICE_ROLE_KEY</code> não foi encontrada.
              </p>
              <details className="text-sm text-yellow-700">
                <summary className="cursor-pointer font-medium hover:text-yellow-800">
                  Como configurar no Bolt.new
                </summary>
                <ol className="list-decimal list-inside mt-2 space-y-1 ml-2">
                  <li>Clique no ícone de configurações (⚙️) do projeto no Bolt</li>
                  <li>Vá em "Secrets" ou "Environment Variables"</li>
                  <li>Adicione: Nome = <code className="bg-yellow-100 px-1 rounded">VITE_SUPABASE_SERVICE_ROLE_KEY</code></li>
                  <li>Cole o valor da service_role key do seu projeto Supabase</li>
                  <li>Salve e faça redeploy do projeto</li>
                </ol>
              </details>
            </div>
          </div>
        </div>
      )}

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
                  {isReadOnly ? (
                    <div className="flex items-center justify-end space-x-2 text-gray-400">
                      <Eye className="w-4 h-4" />
                      <span className="text-xs">Somente leitura</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end space-x-2">
                      {permissions.canEditUsers && user.id !== profile?.id && (
                        <button
                          onClick={() => {
                            setEditingUser(user);
                            setEditEmail(user.email);
                            setEditRole(user.role || 'Analista');
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar usuário"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                      {permissions.canDeleteUsers && user.id !== profile?.id && (
                        <button
                          onClick={() => setDeletingUser(user)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir usuário"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      {user.id === profile?.id && (
                        <span className="text-xs text-gray-400 italic">Você mesmo</span>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal: Adicionar Usuário */}
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

      {/* Modal: Editar Usuário */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Editar Usuário</h3>

            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  id="edit-email"
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="edit-role" className="block text-sm font-medium text-gray-700 mb-2">
                  Função
                </label>
                <select
                  id="edit-role"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRoleType)}
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
                    setEditingUser(null);
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
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Exclusão */}
      {deletingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Confirmar Exclusão</h3>
            </div>

            <p className="text-gray-600 mb-6">
              Tem certeza que deseja excluir o usuário <strong>{deletingUser.email}</strong>? 
              Esta ação não pode ser desfeita.
            </p>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setDeletingUser(null);
                  setError('');
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={loading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Excluindo...' : 'Excluir Usuário'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
