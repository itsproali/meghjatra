import { NextResponse } from 'next/server';
import { admin, isOwnerRequest } from '../../../../lib/supabase';
import { r2Delete } from '../../../../lib/r2';

export const dynamic = 'force-dynamic';

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  if (!isOwnerRequest(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const sb = admin();
  if (!sb) return NextResponse.json({ error: 'backend not configured' }, { status: 500 });
  try {
    const { id } = params;
    const { data: row } = await sb.from('photos').select('path').eq('id', id).single();
    const path = (row as { path?: string } | null)?.path;
    if (path) {
      await r2Delete(path);
    }
    const { error } = await sb.from('photos').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'delete failed' }, { status: 500 });
  }
}
