import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  type ListObjectsV2CommandOutput,
} from '@aws-sdk/client-s3';

// ছবির ফাইল R2-তে রাখি। মেটাডেটা (caption/uploader/url) Supabase DB-তেই থাকে।

let _client: S3Client | null = null;

// R2_ACCOUNT_ID-তে কেউ পুরো endpoint URL বসালেও যেন চলে — শুধু ID অংশটা বের করি
function accountId(raw: string): string {
  const m = raw.match(/([a-z0-9]+)\.r2\.cloudflarestorage\.com/i);
  if (m) return m[1];
  return raw.replace(/^https?:\/\//, '').replace(/\/+$/, '').trim();
}

export function r2(): S3Client | null {
  const rawId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!rawId || !accessKeyId || !secretAccessKey) return null;
  if (!_client) {
    _client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId(rawId)}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  return _client;
}

export const R2_BUCKET = process.env.R2_BUCKET || '';

// পাবলিক URL শেষের '/' ছাড়া রাখি
export const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || '').replace(/\/+$/, '');

// হার্ড স্টোরেজ লিমিট: ৯ GB। এর বেশি কোনোভাবে আপলোড করা যাবে না।
export const STORAGE_LIMIT = 9 * 1024 * 1024 * 1024;

// R2_PUBLIC_URL ঠিকঠাক একটা পাবলিক হোস্ট কিনা। S3 API endpoint (cloudflarestorage.com)
// কখনোই পাবলিক না — সেটা সেট থাকলে আমরা প্রক্সি দিয়ে ছবি সার্ভ করি।
export function r2PublicConfigured(): boolean {
  return !!R2_PUBLIC_URL && !/cloudflarestorage\.com/i.test(R2_PUBLIC_URL);
}

// key-তে folder prefix / স্পেস / ইউনিকোড থাকতে পারে — প্রতিটা সেগমেন্ট আলাদা করে এনকোড করি
export function publicUrl(key: string): string {
  const encoded = key.split('/').map(encodeURIComponent).join('/');
  // সঠিক পাবলিক URL সেট থাকলে r2.dev/কাস্টম ডোমেইন (egress ফ্রি)।
  if (r2PublicConfigured()) return `${R2_PUBLIC_URL}/${encoded}`;
  // না হলে অ্যাপের নিজের প্রক্সি দিয়ে সার্ভ করি — env ভুল থাকলেও ছবি কাজ করবে।
  return `/api/img/${encoded}`;
}

// প্রক্সির জন্য: R2 থেকে অবজেক্ট পড়ি (S3 creds দিয়ে)
export async function r2Get(key: string): Promise<{ body: Uint8Array; contentType: string } | null> {
  const c = r2();
  if (!c) return null;
  try {
    const res = await c.send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    if (!res.Body) return null;
    const body = await res.Body.transformToByteArray();
    return { body, contentType: res.ContentType || 'application/octet-stream' };
  } catch {
    return null;
  }
}

// নতুন অ্যালবাম বানানোর সময় bucket-এ একটা ফোল্ডার মার্কার (`prefix/`) রাখি যাতে
// ফাইল ছাড়াও R2 ড্যাশবোর্ডে ফোল্ডারটা দেখা যায়
export async function r2EnsureFolder(prefix: string): Promise<void> {
  const c = r2();
  if (!c) throw new Error('r2 not configured');
  const key = prefix.replace(/\/+$/, '') + '/';
  await c.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: Buffer.alloc(0),
      ContentType: 'application/x-directory',
    })
  );
}

export async function r2Upload(key: string, body: Buffer, contentType: string): Promise<void> {
  const c = r2();
  if (!c) throw new Error('r2 not configured');
  await c.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}

export async function r2Delete(key: string): Promise<void> {
  const c = r2();
  if (!c) throw new Error('r2 not configured');
  await c.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }));
}

// bucket-এর সব ফাইলের মোট সাইজ (bytes)। এটাই ৯GB গার্ডের ground truth —
// কোনো কাউন্টার drift হয় না, সরাসরি R2 থেকে পড়ে।
export async function r2TotalBytes(): Promise<number> {
  const c = r2();
  if (!c) throw new Error('r2 not configured');
  let total = 0;
  let token: string | undefined = undefined;
  do {
    const res: ListObjectsV2CommandOutput = await c.send(
      new ListObjectsV2Command({
        Bucket: R2_BUCKET,
        ContinuationToken: token,
      })
    );
    for (const obj of res.Contents || []) {
      total += obj.Size || 0;
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  return total;
}
