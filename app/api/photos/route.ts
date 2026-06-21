import { NextResponse } from 'next/server';
import { admin } from '../../../lib/supabase';
import { r2, r2Upload, r2TotalBytes, publicUrl, STORAGE_LIMIT } from '../../../lib/r2';

export const dynamic = 'force-dynamic';

const MAX = 8 * 1024 * 1024; // 8 MB প্রতি ফাইল

export async function GET() {
  const sb = admin();
  if (!sb) return NextResponse.json([]);
  try {
    const { data, error } = await sb
      .from('photos')
      .select('id, url, caption, uploader, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json(data || []);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  const sb = admin();
  if (!sb) return NextResponse.json({ error: 'backend not configured' }, { status: 500 });
  if (!r2()) return NextResponse.json({ error: 'storage not configured' }, { status: 500 });
  try {
    const form = await req.formData();
    const file = form.get('image');
    const caption = (form.get('caption') || '').toString().slice(0, 200);
    const uploader = (form.get('uploader') || 'অজ্ঞাত').toString().slice(0, 60);

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'no image' }, { status: 400 });
    }
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'image only' }, { status: 400 });
    }
    if (file.size > MAX) {
      return NextResponse.json({ error: 'too large (max 8MB)' }, { status: 413 });
    }

    // ৯GB হার্ড লিমিট: bucket-এর আসল মোট সাইজ + এই ফাইল লিমিট ছাড়ালে reject
    const used = await r2TotalBytes();
    if (used + file.size > STORAGE_LIMIT) {
      return NextResponse.json(
        { error: 'স্টোরেজ লিমিট (৯ GB) পূর্ণ হয়ে গেছে, আর ছবি আপলোড করা যাবে না।' },
        { status: 413 }
      );
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const ext =
      (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    await r2Upload(path, buf, file.type);

    const url = publicUrl(path);
    const { data, error } = await sb
      .from('photos')
      .insert({ url, path, caption, uploader })
      .select('id, url, caption, uploader, created_at')
      .single();
    if (error) throw error;

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'upload failed' }, { status: 500 });
  }
}
