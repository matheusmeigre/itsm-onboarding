import 'dotenv/config';
import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import { createClient, User } from '@supabase/supabase-js';
import { z } from 'zod';

interface AuthenticatedRequest extends Request {
  authUser?: User;
  authRole?: string | null;
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const port = Number(process.env.PORT) || 4000;

if (!supabaseUrl || !anonKey || !serviceRoleKey) {
  throw new Error('Supabase env vars (URL, anon key, service role) are required');
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const supabaseAnon = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: false },
});

const app = express();
app.use(cors());
app.use(express.json());

const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };

const authenticate = asyncHandler(async (req: AuthenticatedRequest, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Missing bearer token' });
    return;
  }

  const token = authHeader.replace('Bearer ', '');
  const { data, error } = await supabaseAnon.auth.getUser(token);

  if (error || !data.user) {
    res.status(401).json({ message: 'Invalid or expired token' });
    return;
  }

  req.authUser = data.user;

  const { data: roleData, error: roleError } = await supabaseAnon
    .from('user_roles')
    .select('role')
    .eq('user_id', data.user.id)
    .maybeSingle();

  if (roleError) {
    res.status(500).json({ message: 'Could not resolve user role' });
    return;
  }

  req.authRole = roleData?.role ?? null;
  next();
});

const ensureManager = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.authRole !== 'Gerente') {
    res.status(403).json({ message: 'Insufficient permissions' });
    return;
  }

  next();
};

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['Analista', 'Coordenador', 'Gerente']),
});

const updateRoleSchema = z.object({
  role: z.enum(['Analista', 'Coordenador', 'Gerente']),
});

type AdminUser = {
  id: string;
  email: string;
  role: string | null;
  role_id: string | null;
  created_at: string;
};

app.get(
  '/api/admin/users',
  authenticate,
  ensureManager,
  asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    if (authError) {
      res.status(500).json({ message: authError.message });
      return;
    }

    const { data: roleRows, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('id, user_id, role');

    if (rolesError) {
      res.status(500).json({ message: rolesError.message });
      return;
    }

    const users: AdminUser[] = authUsers.users.map((user) => {
      const role = roleRows?.find((row) => row.user_id === user.id);
      return {
        id: user.id,
        email: user.email ?? '',
        role: role?.role ?? null,
        role_id: role?.id ?? null,
        created_at: user.created_at,
      };
    });

    res.json({ users });
  }),
);

app.post(
  '/api/admin/users',
  authenticate,
  ensureManager,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const parseResult = createUserSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ message: 'Invalid payload', issues: parseResult.error.flatten() });
      return;
    }

    const { email, password, role } = parseResult.data;

    const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError || !createdUser.user) {
      res.status(400).json({ message: createError?.message ?? 'Failed to create user' });
      return;
    }

    const { error: insertRoleError } = await supabaseAdmin.from('user_roles').insert({
      user_id: createdUser.user.id,
      role,
      assigned_by: req.authUser?.id ?? createdUser.user.id,
    });

    if (insertRoleError) {
      res.status(500).json({ message: insertRoleError.message });
      return;
    }

    res.status(201).json({ id: createdUser.user.id });
  }),
);

app.patch(
  '/api/admin/users/:id/role',
  authenticate,
  ensureManager,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const parseResult = updateRoleSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ message: 'Invalid payload', issues: parseResult.error.flatten() });
      return;
    }

    const userId = req.params.id;
    const { role } = parseResult.data;

    const { error: upsertError } = await supabaseAdmin
      .from('user_roles')
      .upsert({
        user_id: userId,
        role,
        assigned_by: req.authUser?.id ?? userId,
      });

    if (upsertError) {
      res.status(500).json({ message: upsertError.message });
      return;
    }

    res.json({ success: true });
  }),
);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  void _next;
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
});
