import { NextResponse } from "next/server";
import { admin } from "../../../lib/supabase";
import { r2, r2Upload, r2EnsureFolder, r2TotalBytes, publicUrl, r2PublicConfigured, STORAGE_LIMIT } from "../../../lib/r2";

export const dynamic = "force-dynamic";

const MAX = 8 * 1024 * 1024; // 8 MB per file
const MAX_FOLDERS = 15; // max number of albums

export async function GET() {
  const sb = admin();
  if (!sb) return NextResponse.json([]);
  try {
    const { data, error } = await sb
      .from("photos")
      .select("id, url, caption, uploader, folder, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json(data || []);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  const sb = admin();
  if (!sb) return NextResponse.json({ error: "backend not configured" }, { status: 500 });
  if (!r2()) return NextResponse.json({ error: "storage not configured" }, { status: 500 });
  // Reject early on a misconfigured R2_PUBLIC_URL so we never upload or store a broken url.
  if (!r2PublicConfigured()) {
    return NextResponse.json({ error: "R2_PUBLIC_URL ঠিকভাবে সেট করা নেই (pub-xxxx.r2.dev দরকার)" }, { status: 500 });
  }
  try {
    const form = await req.formData();
    const file = form.get("image");
    const caption = (form.get("caption") || "").toString().slice(0, 200);
    const uploader = (form.get("uploader") || "অজ্ঞাত").toString().slice(0, 60);
    const folder = (form.get("folder") || "").toString().trim().slice(0, 60);

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "no image" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "image only" }, { status: 400 });
    }
    if (file.size > MAX) {
      return NextResponse.json({ error: "too large (max 8MB)" }, { status: 413 });
    }
    if (!folder) {
      return NextResponse.json({ error: "একটা অ্যালবাম বেছে নাও বা নতুন বানাও" }, { status: 400 });
    }

    // album limit: at most MAX_FOLDERS distinct albums
    const { data: existing } = await sb.from("photos").select("folder").not("folder", "is", null);
    const distinct = new Set((existing || []).map((r) => (r as { folder: string }).folder));
    const isNewFolder = !distinct.has(folder);
    if (isNewFolder && distinct.size >= MAX_FOLDERS) {
      return NextResponse.json({ error: "সর্বোচ্চ ১৫টা অ্যালবাম বানানো যাবে" }, { status: 400 });
    }

    // hard 9GB limit: reject if the bucket's real total + this file exceeds it
    const used = await r2TotalBytes();
    if (used + file.size > STORAGE_LIMIT) {
      return NextResponse.json({ error: "স্টোরেজ লিমিট (৯ GB) পূর্ণ হয়ে গেছে, আর ছবি আপলোড করা যাবে না।" }, { status: 413 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    // use the folder as a key prefix (strip slashes to avoid nesting; spaces/unicode are encoded in publicUrl)
    const prefix = folder.replace(/[\\/]+/g, "-").replace(/^-+|-+$/g, "");
    const fname = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const path = prefix ? `${prefix}/${fname}` : fname;

    // create the folder in the bucket for a new album
    if (isNewFolder && prefix) await r2EnsureFolder(prefix);
    await r2Upload(path, buf, file.type);

    const url = publicUrl(path);
    const { data, error } = await sb
      .from("photos")
      .insert({ url, path, caption, uploader, folder })
      .select("id, url, caption, uploader, folder, created_at")
      .single();
    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "upload failed" }, { status: 500 });
  }
}
