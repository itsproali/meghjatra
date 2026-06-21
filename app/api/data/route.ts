import { NextResponse } from 'next/server';
import { admin, isOwnerRequest } from '../../../lib/supabase';
import type { TripState } from '../../../lib/types';

export const dynamic = 'force-dynamic';

const EMPTY: TripState = { members: [], contributions: [], expenses: [] };

export async function GET() {
  const sb = admin();
  if (!sb) return NextResponse.json(EMPTY);
  try {
    const { data, error } = await sb.from('app_state').select('data').eq('id', 1).single();
    if (error) throw error;
    return NextResponse.json({ ...EMPTY, ...((data?.data as Partial<TripState>) || {}) });
  } catch {
    return NextResponse.json(EMPTY);
  }
}

export async function POST(req: Request) {
  if (!isOwnerRequest(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const sb = admin();
  if (!sb) return NextResponse.json({ error: 'backend not configured' }, { status: 500 });
  try {
    const body = (await req.json()) as Partial<TripState>;
    const data: TripState = {
      members: body.members || [],
      contributions: body.contributions || [],
      expenses: body.expenses || [],
    };
    const { error } = await sb.from('app_state').upsert({ id: 1, data });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'save failed' }, { status: 500 });
  }
}
