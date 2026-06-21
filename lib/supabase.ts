import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

export function admin(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  if (!_client) {
    _client = createClient(url, key, { auth: { persistSession: false } });
  }
  return _client;
}

export function isOwnerRequest(req: Request): boolean {
  const pw = process.env.OWNER_PASSWORD;
  if (!pw) return false;
  return req.headers.get('x-owner-key') === pw;
}
