import { r2Get } from '../../../../lib/r2';

export const dynamic = 'force-dynamic';

// R2 ইমেজ প্রক্সি — R2_PUBLIC_URL ঠিকভাবে সেট না থাকলেও ছবি সার্ভ করে।
// key catch-all সেগমেন্টগুলো Next আগেই ডিকোড করে দেয়, তাই সরাসরি জোড়া লাগাই।
export async function GET(_req: Request, { params }: { params: { key: string[] } }) {
  const key = (params.key || []).join('/');
  if (!key) return new Response('not found', { status: 404 });

  const obj = await r2Get(key);
  if (!obj) return new Response('not found', { status: 404 });

  return new Response(obj.body, {
    headers: {
      'Content-Type': obj.contentType,
      // key ইউনিক — তাই চিরকাল ক্যাশ করা নিরাপদ (Vercel/CDN ক্যাশ করে egress কমায়)
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
