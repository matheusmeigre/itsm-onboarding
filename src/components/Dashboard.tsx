import { useCallback, useEffect, useState } from 'react';
import { FileText, CheckCircle, Clock, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { fetchDashboardStats } from '../services/documentService';
import { Skeleton } from './ui/Skeleton';

interface Stats {
  totalDocuments: number;
  approvedDocuments: number;
  pendingApprovals: number;
  myDrafts: number;
}

export function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalDocuments: 0,
    approvedDocuments: 0,
    pendingApprovals: 0,
    myDrafts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      setError(null);
      const { totalDocuments, approvedDocuments, pendingApprovals, myDrafts, error } = await fetchDashboardStats(
        profile?.id,
      );

      if (error) {
        throw error;
      }

      setStats({
        totalDocuments,
        approvedDocuments,
        pendingApprovals,
        myDrafts,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      setError('Não foi possível carregar os indicadores');
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const statCards = [
    {
      title: 'Total de Documentos',
      value: stats.totalDocuments,
      icon: FileText,
      color: 'bg-blue-500',
    },
    {
      title: 'Documentos Aprovados',
      value: stats.approvedDocuments,
      icon: CheckCircle,
      color: 'bg-green-500',
    },
    {
      title: 'Aguardando Aprovação',
      value: stats.pendingApprovals,
      icon: Clock,
      color: 'bg-yellow-500',
    },
    {
      title: 'Meus Rascunhos',
      value: stats.myDrafts,
      icon: Users,
      color: 'bg-gray-500',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-3" />
                  <Skeleton className="h-10 w-16" />
                </div>
                <Skeleton className="h-12 w-12 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4 text-center">
        <p className="text-red-600 font-medium">{error}</p>
        <button
          onClick={loadStats}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Bem-vindo ao Portal de Documentação
        </h2>
        <p className="text-gray-600">
          Sistema de gerenciamento de documentação e onboarding da equipe de TI
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
                </div>
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Sobre o Sistema
        </h3>
        <div className="space-y-4 text-gray-600">
          <p>
            Este portal foi desenvolvido para centralizar toda a documentação necessária
            para o onboarding de novos colaboradores da equipe de TI.
          </p>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Principais Funcionalidades:</h4>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Criação e gerenciamento de documentos técnicos</li>
              <li>Sistema de aprovação com diferentes níveis de permissão</li>
              <li>Categorização hierárquica de documentos</li>
              <li>Histórico completo de alterações</li>
              <li>Comentários e colaboração em documentos</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Níveis de Acesso:</h4>
            <ul className="space-y-2 ml-2">
              <li>
                <span className="font-medium">Analista:</span> Pode criar rascunhos e editar seus próprios documentos
              </li>
              <li>
                <span className="font-medium">Coordenador:</span> Pode criar, editar todos os documentos e aprovar rascunhos de analistas
              </li>
              <li>
                <span className="font-medium">Gerente:</span> Acesso total incluindo gestão de usuários e permissões
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
