import { useEffect, useState } from 'react';
import { FileText, CheckCircle, Clock, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

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

  useEffect(() => {
    loadStats();
  }, [profile]);

  const loadStats = async () => {
    try {
      const { data: allDocs } = await supabase
        .from('documents')
        .select('id, status, author_id');

      if (allDocs) {
        setStats({
          totalDocuments: allDocs.length,
          approvedDocuments: allDocs.filter(d => d.status === 'Aprovado').length,
          pendingApprovals: allDocs.filter(d => d.status === 'Aguardando Aprovação').length,
          myDrafts: allDocs.filter(d => d.author_id === profile?.id && d.status === 'Rascunho').length,
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

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
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando...</div>
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
