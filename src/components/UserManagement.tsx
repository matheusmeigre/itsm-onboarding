import { useCallback, useEffect, useState } from 'react';
import { Users, UserPlus, Shield, Pencil, Trash2, Eye, AlertCircle, Upload, FileText, X } from 'lucide-react';
import { supabaseAdmin, isAdminAvailable } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getUserPermissions, getRoleBadgeColor } from '../lib/permissions';
import type { UserRoleType } from '../lib/database.types';
import type { User } from '@supabase/supabase-js';
import { SkeletonTable } from './ui/Skeleton';
import { ConfirmDialog } from './ui/ConfirmDialog';

interface UserWithRole {
  id: string;
  email: string;
  role: UserRoleType | null;
  role_id: string | null;
  created_at: string;
}

interface ImportUser {
  email: string;
  password: string;
  role: UserRoleType;
}

export function UserManagement() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserWithRole | null>(null);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRoleType>('Analista');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<UserRoleType>('Analista');
  const [error, setError] = useState('');
  const [importText, setImportText] = useState('');
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);
  const [importResults, setImportResults] = useState<{ success: number; failed: number; errors: string[] }>({
    success: 0,
    failed: 0,
    errors: []
  });
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
      const { data: { users: authUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers();

      if (authError) {
        if (authError.message?.includes('not allowed') || authError.message?.includes('JWT')) {
          throw new Error('Service role key não configurada corretamente. Verifique se VITE_SUPABASE_SERVICE_ROLE_KEY está nas variáveis de ambiente.');
        }
        throw authError;
      }

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

  const parseImportText = (text: string): ImportUser[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const users: ImportUser[] = [];

    for (const line of lines) {
      // Suporta CSV (email,password,role) ou formato simples (email password role)
      const parts = line.includes(',') 
        ? line.split(',').map(p => p.trim())
        : line.split(/\s+/).filter(p => p);

      if (parts.length >= 3) {
        const [email, password, role] = parts;
        
        // Validar role
        if (['Analista', 'Coordenador', 'Gerente'].includes(role)) {
          users.push({
            email,
            password,
            role: role as UserRoleType
          });
        }
      }
    }

    return users;
  };

  const handleImportUsers = async () => {
    const importUsers = parseImportText(importText);
    
    if (importUsers.length === 0) {
      setError('Nenhum usuário válido encontrado no arquivo. Formato esperado: email,senha,cargo ou email senha cargo');
      return;
    }

    setImportProgress({ current: 0, total: importUsers.length });
    setImportResults({ success: 0, failed: 0, errors: [] });
    setError('');

    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < importUsers.length; i++) {
      const user = importUsers[i];
      setImportProgress({ current: i + 1, total: importUsers.length });

      try {
        const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: {
            role: user.role
          }
        });

        if (createError) throw createError;

        if (userData.user) {
          // Aguardar um pouco para o trigger de profile ser executado
          await new Promise(resolve => setTimeout(resolve, 300));

          // Criar role do usuário
          const { error: roleError } = await supabaseAdmin.from('user_roles').insert({
            user_id: userData.user.id,
            role: user.role,
            assigned_by: profile!.id,
          } as any);

          if (roleError) {
            // Tentar criar o profile manualmente se não existir
            await supabaseAdmin.from('profiles').upsert({
              id: userData.user.id,
              email: userData.user.email,
              role: user.role,
              avatar: 'bg-gray-400'
            } as any, { onConflict: 'id' });
            
            throw roleError;
          }
        }

        successCount++;
      } catch (err) {
        failedCount++;
        errors.push(`${user.email}: ${(err as Error).message}`);
      }
    }

    setImportResults({ success: successCount, failed: failedCount, errors });
    setImportProgress(null);

    if (failedCount === 0) {
      setImportText('');
      setTimeout(() => {
        setShowImportModal(false);
        setImportResults({ success: 0, failed: 0, errors: [] });
      }, 3000);
    }

    await loadUsers();
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: newUserEmail,
        password: newUserPassword,
        email_confirm: true,
        user_metadata: {
          role: newUserRole
        }
      });

      if (createError) {
        if (createError.message?.includes('not allowed') || createError.message?.includes('JWT')) {
          throw new Error('Service role key não configurada corretamente.');
        }
        throw createError;
      }

      if (userData.user) {
        // Aguardar um pouco para o trigger de profile ser executado
        await new Promise(resolve => setTimeout(resolve, 500));

        // Criar role do usuário
        const { error: roleError } = await supabaseAdmin.from('user_roles').insert({
          user_id: userData.user.id,
          role: newUserRole,
          assigned_by: profile!.id,
        } as any);

        if (roleError) {
          console.error('Error creating role:', roleError);
          // Tentar criar o profile manualmente se não existir
          await supabaseAdmin.from('profiles').upsert({
            id: userData.user.id,
            email: userData.user.email,
            role: newUserRole,
            avatar: 'bg-gray-400'
          } as any, { onConflict: 'id' });
          
          throw roleError;
        }
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
      if (editEmail !== editingUser.email) {
        const { error: emailError } = await supabaseAdmin.auth.admin.updateUserById(
          editingUser.id,
          { email: editEmail }
        );
        if (emailError) throw emailError;
      }

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
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('user_id', deletingUser.id);
      
      if (roleError) {
        console.error('Erro ao deletar role:', roleError);
      }

      try {
        const { error } = await (supabaseAdmin.rpc as any)('cleanup_user_references', { 
          target_user_id: deletingUser.id 
        });
        
        if (error) throw error;
      } catch (rpcError) {
        console.warn('RPC não disponível, usando operações diretas');
        
        await (supabaseAdmin.from('documents') as any)
          .update({ approved_by: null })
          .eq('approved_by', deletingUser.id);

        await (supabaseAdmin.from('user_roles') as any)
          .update({ assigned_by: null })
          .eq('assigned_by', deletingUser.id);

        await (supabaseAdmin.from('document_history') as any)
          .delete()
          .eq('changed_by', deletingUser.id);
      }

      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(deletingUser.id);
      
      if (deleteError) {
        throw new Error(`Erro ao deletar usuário: ${deleteError.message}`);
      }

      setDeletingUser(null);
      await loadUsers();
    } catch (error) {
      console.error('Erro na deleção:', error);
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
          <div className="flex space-x-3">
            <button
              onClick={() => setShowImportModal(true)}
              disabled={!isAdminAvailable}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              title={!isAdminAvailable ? 'Configuração de admin necessária' : 'Importar múltiplos usuários'}
            >
              <Upload className="w-5 h-5" />
              <span className="font-medium">Importar</span>
            </button>
            <button
              onClick={() => setShowAddUser(true)}
              disabled={!isAdminAvailable}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              title={!isAdminAvailable ? 'Configuração de admin necessária' : ''}
            >
              <UserPlus className="w-5 h-5" />
              <span className="font-medium">Adicionar Usuário</span>
            </button>
          </div>
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
        {loading && users.length === 0 ? (
          <SkeletonTable rows={5} />
        ) : (
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
              <tr key={user.id} className="hover:bg-blue-50 transition-all duration-200 hover:shadow-sm">
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
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all duration-200 transform hover:scale-110 active:scale-95 hover:shadow-md"
                          title="Editar usuário"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                      {permissions.canDeleteUsers && user.id !== profile?.id && (
                        <button
                          onClick={() => setDeletingUser(user)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all duration-200 transform hover:scale-110 active:scale-95 hover:shadow-md"
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
        )}
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
                  Cargo
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

      {/* Modal: Importar Usuários */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Importar Usuários</h3>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportText('');
                  setImportResults({ success: 0, failed: 0, errors: [] });
                  setError('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 text-sm">
                    <p className="font-medium text-blue-900 mb-2">Formatos aceitos:</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-800">
                      <li><strong>CSV:</strong> email,senha,cargo</li>
                      <li><strong>Texto:</strong> email senha cargo</li>
                      <li><strong>Markdown:</strong> - email senha cargo</li>
                    </ul>
                    <p className="mt-2 text-blue-800">
                      <strong>Cargos válidos:</strong> Analista, Coordenador, Gerente
                    </p>
                    <p className="mt-2 text-blue-700 text-xs">
                      Exemplo: <code className="bg-blue-100 px-1 rounded">joao@empresa.com,senha123,Analista</code>
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cole os dados dos usuários
                </label>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  rows={10}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder="joao@empresa.com,senha123,Analista&#10;maria@empresa.com,senha456,Coordenador&#10;admin@empresa.com,senha789,Gerente"
                />
              </div>

              {importProgress && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Importando usuários: {importProgress.current} de {importProgress.total}
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {(importResults.success > 0 || importResults.failed > 0) && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Resultado da importação:</p>
                  <div className="flex space-x-4 text-sm">
                    <span className="text-green-600">✓ {importResults.success} sucesso</span>
                    <span className="text-red-600">✗ {importResults.failed} falhas</span>
                  </div>
                  {importResults.errors.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <p className="text-xs font-medium text-red-700">Erros:</p>
                      <div className="max-h-32 overflow-y-auto">
                        {importResults.errors.map((err, idx) => (
                          <p key={idx} className="text-xs text-red-600">• {err}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    setImportText('');
                    setImportResults({ success: 0, failed: 0, errors: [] });
                    setError('');
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Fechar
                </button>
                <button
                  onClick={handleImportUsers}
                  disabled={!importText.trim() || importProgress !== null}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {importProgress ? 'Importando...' : 'Importar Usuários'}
                </button>
              </div>
            </div>
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
                  Cargo
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
      <ConfirmDialog
        isOpen={!!deletingUser}
        onClose={() => {
          setDeletingUser(null);
          setError('');
        }}
        onConfirm={handleDeleteUser}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir o usuário ${deletingUser?.email}? Esta ação não pode ser desfeita e todos os dados relacionados ao usuário serão removidos.`}
        confirmText="Sim, excluir"
        cancelText="Cancelar"
        variant="danger"
        isLoading={loading}
      />
    </div>
  );
}
