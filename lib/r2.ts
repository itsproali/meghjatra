import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  type ListObjectsV2CommandOutput,
} from '@aws-sdk/client-s3';

// Photo files live in R2; their metadata (caption/uploader/url) lives in the Supabase DB.

let _client: S3Client | null = null;

// Accept a full endpoint URL in R2_ACCOUNT_ID and extract just the ID part.
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

// Public URL kept without a trailing '/'.
export const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || '').replace(/\/+$/, '');

// Hard storage limit: 9 GB. Uploads beyond this are always rejected.
export const STORAGE_LIMIT = 9 * 1024 * 1024 * 1024;

// Whether R2_PUBLIC_URL is a valid public host (pure string check, no R2 call).
// False for the S3 API endpoint (cloudflarestorage.com) or empty — prevents storing a broken url on upload.
export function r2PublicConfigured(): boolean {
  return /^https?:\/\//i.test(R2_PUBLIC_URL) && !/cloudflarestorage\.com/i.test(R2_PUBLIC_URL);
}

// Built once on upload and saved to the DB; GET returns that saved url later.
// A key may contain a folder prefix / spaces / unicode, so each segment is encoded separately.
export function publicUrl(key: string): string {
  const encoded = key.split('/').map(encodeURIComponent).join('/');
  return `${R2_PUBLIC_URL}/${encoded}`;
}

// On a new album, write a folder marker (`prefix/`) so the folder shows up in the R2 dashboard even with no files.
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

// Total size of all bucket files (bytes) — the ground truth for the 9GB guard,
// read straight from R2 so no counter can drift.
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
