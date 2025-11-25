import type { UserRoleType } from '../lib/database.types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

async function request<T>(path: string, options: RequestInit & { token: string }): Promise<T> {
  const { token, ...rest } = options;
  const headers = new Headers(rest.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  if (rest.body) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers,
  });

  if (!response.ok) {
    let message = 'Falha na requisição';
    try {
      const errorBody = await response.json();
      if (typeof errorBody?.message === 'string') {
        message = errorBody.message;
      }
    } catch (error) {
      console.error('Failed to parse API error', error);
    }

    throw new Error(message);
  }

  return response.json();
}

export interface AdminUser {
  id: string;
  email: string;
  role: UserRoleType | null;
  role_id: string | null;
  created_at: string;
}

export async function listAdminUsers(token: string) {
  return request<{ users: AdminUser[] }>('/admin/users', {
    method: 'GET',
    token,
  });
}

export async function createAdminUser(
  token: string,
  payload: { email: string; password: string; role: UserRoleType },
) {
  return request<{ id: string }>('/admin/users', {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
  });
}

export async function updateAdminUserRole(token: string, userId: string, role: UserRoleType) {
  return request<{ success: boolean }>(`/admin/users/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
    token,
  });
}
