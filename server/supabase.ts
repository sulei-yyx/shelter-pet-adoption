function getSupabaseUrl() {
  return process.env.SUPABASE_URL;
}

function getSupabaseServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY;
}

function assertConfig() {
  if (!getSupabaseUrl() || !getSupabaseServiceRoleKey()) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  }
}

function buildHeaders(extra?: HeadersInit): HeadersInit {
  assertConfig();
  return {
    apikey: getSupabaseServiceRoleKey()!,
    Authorization: `Bearer ${getSupabaseServiceRoleKey()!}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

export async function supabaseRequest<T>(path: string, init?: RequestInit): Promise<T> {
  assertConfig();

  const response = await fetch(`${getSupabaseUrl()!}/rest/v1/${path}`, {
    ...init,
    headers: buildHeaders(init?.headers),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase request failed: ${text}`);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json() as Promise<T>;
}
