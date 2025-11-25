import type { UserRoleType, DocumentStatusType } from './database.types';

export interface PermissionCheck {
  canCreate: boolean;
  canEdit: boolean;
  canApprove: boolean;
  canDelete: boolean;
  canManageUsers: boolean;
  canViewUsers: boolean;
  canEditUsers: boolean;
  canDeleteUsers: boolean;
  canManageCategories: boolean;
}

export function getUserPermissions(role: UserRoleType | null): PermissionCheck {
  if (!role) {
    return {
      canCreate: false,
      canEdit: false,
      canApprove: false,
      canDelete: false,
      canManageUsers: false,
      canViewUsers: false,
      canEditUsers: false,
      canDeleteUsers: false,
      canManageCategories: false,
    };
  }

  switch (role) {
    case 'Analista':
      return {
        canCreate: true,
        canEdit: false,
        canApprove: false,
        canDelete: false,
        canManageUsers: false,
        canViewUsers: false,
        canEditUsers: false,
        canDeleteUsers: false,
        canManageCategories: false,
      };

    case 'Coordenador':
      return {
        canCreate: true,
        canEdit: true,
        canApprove: true,
        canDelete: false,
        canManageUsers: false,
        canViewUsers: true,
        canEditUsers: false,
        canDeleteUsers: false,
        canManageCategories: true,
      };

    case 'Gerente':
      return {
        canCreate: true,
        canEdit: true,
        canApprove: true,
        canDelete: true,
        canManageUsers: true,
        canViewUsers: true,
        canEditUsers: true,
        canDeleteUsers: true,
        canManageCategories: true,
      };

    default:
      return {
        canCreate: false,
        canEdit: false,
        canApprove: false,
        canDelete: false,
        canManageUsers: false,
        canViewUsers: false,
        canEditUsers: false,
        canDeleteUsers: false,
        canManageCategories: false,
      };
  }
}

export function canEditDocument(
  role: UserRoleType | null,
  documentStatus: DocumentStatusType,
  isAuthor: boolean
): boolean {
  if (!role) return false;

  if (role === 'Gerente') return true;

  if (role === 'Coordenador') return true;

  if (role === 'Analista' && isAuthor) {
    return documentStatus === 'Rascunho' || documentStatus === 'Aguardando Aprovação';
  }

  return false;
}

export function canApproveDocument(
  role: UserRoleType | null,
  documentStatus: DocumentStatusType,
  documentAuthorRole: UserRoleType | null
): boolean {
  if (!role) return false;

  if (role === 'Gerente') return true;

  if (role === 'Coordenador') {
    return (
      documentStatus === 'Aguardando Aprovação' &&
      documentAuthorRole === 'Analista'
    );
  }

  return false;
}

export function canDeleteDocument(role: UserRoleType | null): boolean {
  return role === 'Gerente';
}

export function canViewDocument(
  role: UserRoleType | null,
  documentStatus: DocumentStatusType,
  isAuthor: boolean
): boolean {
  if (!role) return false;

  if (documentStatus === 'Aprovado') return true;

  if (isAuthor) return true;

  if (role === 'Coordenador' || role === 'Gerente') return true;

  return false;
}

export function getDocumentStatusColor(status: DocumentStatusType): string {
  switch (status) {
    case 'Rascunho':
      return 'bg-gray-100 text-gray-800';
    case 'Aguardando Aprovação':
      return 'bg-yellow-100 text-yellow-800';
    case 'Aprovado':
      return 'bg-green-100 text-green-800';
    case 'Arquivado':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getRoleBadgeColor(role: UserRoleType): string {
  switch (role) {
    case 'Analista':
      return 'bg-blue-100 text-blue-800';
    case 'Coordenador':
      return 'bg-purple-100 text-purple-800';
    case 'Gerente':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
