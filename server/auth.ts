import type { Request } from 'express';

export type AuthenticatedUser = {
  id: string;
  email?: string;
};

export async function authenticateRequest(req: Request): Promise<AuthenticatedUser | null> {
  const authorization = req.header('authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return null;
  }

  const accessToken = authorization.slice('Bearer '.length).trim();
  if (!accessToken) {
    return null;
  }

  const response = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as { id: string; email?: string };
  return { id: payload.id, email: payload.email };
}

export async function createConfirmedUser(email: string, password: string) {
  const response = await fetch(`${process.env.SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text);
  }

  return response.json() as Promise<{ id: string; email: string }>;
}
