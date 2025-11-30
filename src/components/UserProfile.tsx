import { useState, useEffect } from 'react';
import { User, Save, X, Edit2, Mail, Briefcase } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { AvatarSelector } from './AvatarSelector';

interface ProfileData {
  first_name: string;
  last_name: string;
  age: string;
  bio: string;
  avatar: string;
}

// Função para renderizar avatar circular com silhueta
const renderAvatar = (color: string, size: 'sm' | 'md' | 'lg' = 'md') => {
  const sizeClasses = size === 'lg' ? 'w-20 h-20' : size === 'md' ? 'w-10 h-10' : 'w-8 h-8';
  return (
    <div className={`${sizeClasses} ${color} rounded-full flex items-center justify-center relative overflow-hidden shadow-lg smooth-transition group-hover:scale-110`}>
      <div className="absolute inset-0 flex items-end justify-center">
        <div className="relative" style={{ width: '70%', height: '70%' }}>
          <div className="absolute top-[15%] left-1/2 transform -translate-x-1/2 w-[35%] h-[35%] bg-white/90 rounded-full"></div>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[70%] h-[55%] bg-white/90 rounded-t-full"></div>
        </div>
      </div>
    </div>
  );
};

export function UserProfile() {
  const { profile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profileData, setProfileData] = useState<ProfileData>({
    first_name: '',
    last_name: '',
    age: '',
    bio: '',
    avatar: '👤',
  });

  useEffect(() => {
    loadProfile();
  }, [profile?.id]);

  const loadProfile = async () => {
    if (!profile?.id) return;

    setLoading(true);
    setError('');

    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('first_name, last_name, age, bio, avatar')
        .eq('id', profile.id)
        .single();

      if (fetchError) throw fetchError;

      if (data) {
        const profileData = data as any;
        setProfileData({
          first_name: profileData.first_name || '',
          last_name: profileData.last_name || '',
          age: profileData.age || '',
          bio: profileData.bio || '',
          avatar: profileData.avatar || 'bg-gray-400',
        });
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Erro ao carregar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile?.id) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const updateData = {
        first_name: profileData.first_name || null,
        last_name: profileData.last_name || null,
        age: profileData.age || null,
        bio: profileData.bio || null,
        avatar: profileData.avatar || 'bg-gray-400',
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await (supabase
        .from('profiles') as any)
        .update(updateData)
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setSuccess('Perfil atualizado com sucesso!');
      setIsEditing(false);
      
      // Força reload do avatar no Layout
      window.dispatchEvent(new CustomEvent('profileUpdated'));
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Erro ao atualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    loadProfile();
    setIsEditing(false);
    setError('');
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-8 animate-smoothPulse">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-20 h-20 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-3">
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl p-8 text-white animate-slideInTop">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="smooth-transition hover:scale-110">
              {renderAvatar(profileData.avatar || 'bg-gray-400', 'lg')}
            </div>
            <div>
              <h1 className="text-3xl font-bold">
                {profileData.first_name || profileData.last_name
                  ? `${profileData.first_name} ${profileData.last_name}`.trim()
                  : 'Seu Perfil'}
              </h1>
              <p className="text-blue-100 mt-1">Gerencie suas informações pessoais</p>
            </div>
          </div>

          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-6 py-3 rounded-lg smooth-transition hover-lift"
            >
              <Edit2 className="w-5 h-5" />
              <span className="font-medium">Editar Perfil</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg animate-slideInRight">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg animate-slideInRight">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {/* Profile Content */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden animate-slideInBottom">
        <div className="p-8 space-y-8">
          {/* Avatar Selection */}
          {isEditing && (
            <div className="pb-8 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Escolha seu Avatar</h3>
              <AvatarSelector
                selected={profileData.avatar}
                onSelect={(emoji) => setProfileData({ ...profileData, avatar: emoji })}
              />
            </div>
          )}

          {/* Account Info */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <User className="w-5 h-5 text-blue-600" />
              <span>Informações da Conta</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                  <Mail className="w-4 h-4" />
                  <span>Email</span>
                </label>
                <input
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-500 cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                  <Briefcase className="w-4 h-4" />
                  <span>Função</span>
                </label>
                <input
                  type="text"
                  value={profile?.role || 'Não definida'}
                  disabled
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Personal Info */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações Pessoais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                  Nome
                </label>
                <input
                  id="first_name"
                  type="text"
                  value={profileData.first_name}
                  onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                  disabled={!isEditing}
                  className={`w-full px-4 py-2 border border-gray-300 rounded-lg smooth-transition ${
                    isEditing
                      ? 'focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                      : 'bg-gray-50 text-gray-500 cursor-not-allowed'
                  }`}
                  placeholder="Seu nome"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                  Sobrenome
                </label>
                <input
                  id="last_name"
                  type="text"
                  value={profileData.last_name}
                  onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                  disabled={!isEditing}
                  className={`w-full px-4 py-2 border border-gray-300 rounded-lg smooth-transition ${
                    isEditing
                      ? 'focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                      : 'bg-gray-50 text-gray-500 cursor-not-allowed'
                  }`}
                  placeholder="Seu sobrenome"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="age" className="block text-sm font-medium text-gray-700">
                  Idade
                </label>
                <input
                  id="age"
                  type="number"
                  value={profileData.age}
                  onChange={(e) => setProfileData({ ...profileData, age: e.target.value })}
                  disabled={!isEditing}
                  className={`w-full px-4 py-2 border border-gray-300 rounded-lg smooth-transition ${
                    isEditing
                      ? 'focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                      : 'bg-gray-50 text-gray-500 cursor-not-allowed'
                  }`}
                  placeholder="Sua idade"
                  min="18"
                  max="120"
                />
              </div>
            </div>
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
              Biografia
            </label>
            <textarea
              id="bio"
              value={profileData.bio}
              onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
              disabled={!isEditing}
              rows={4}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg smooth-transition resize-none ${
                isEditing
                  ? 'focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  : 'bg-gray-50 text-gray-500 cursor-not-allowed'
              }`}
              placeholder="Conte um pouco sobre você..."
              maxLength={500}
            />
            <p className="text-sm text-gray-500 mt-1">
              {profileData.bio.length}/500 caracteres
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="bg-gray-50 px-8 py-4 flex items-center justify-end space-x-3 border-t border-gray-200">
            <button
              onClick={handleCancel}
              disabled={saving}
              className="flex items-center space-x-2 px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 smooth-transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-4 h-4" />
              <span>Cancelar</span>
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg smooth-transition hover-lift disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-smoothSpin"></div>
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Salvar Alterações</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
