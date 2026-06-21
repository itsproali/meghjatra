import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const pw = process.env.OWNER_PASSWORD;
  try {
    const { password } = (await req.json()) as { password?: string };
    return NextResponse.json({ ok: !!pw && password === pw });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
