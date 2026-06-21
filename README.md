# সাজেক ট্যুর অ্যাপ

তিনটা পেজ:

- **`/`** — খরচের হিসাব। **সবাই দেখতে পারবে, শুধু ম্যানেজার (তুমি) পাসওয়ার্ড দিয়ে এডিট করতে পারবে।**
- **`/gallery`** — ছবি শেয়ার। **যে কেউ ছবি আপলোড করতে পারবে, সবাই দেখতে ও ডাউনলোড করতে পারবে।**
- **`/plan`** — পুরো ট্যুর প্ল্যান।

ডিলিট/রিমুভে সবসময় কনফার্মেশন মডাল আসে।

ডেটা একটা শেয়ারড ব্যাকএন্ডে (Supabase) থাকে, তাই লিংক শেয়ার করলে সবাই একই হিসাব ও ছবি দেখবে।

---

## ১. Supabase সেটআপ (ফ্রি)

1. [supabase.com](https://supabase.com) → নতুন project বানাও।
2. **SQL Editor** → নিচের কোড paste করে **Run** করো:

   ```sql
   create extension if not exists "pgcrypto";

   create table if not exists app_state (
     id int primary key,
     data jsonb not null default '{"members":[],"contributions":[],"expenses":[]}'
   );
   insert into app_state (id) values (1) on conflict (id) do nothing;

   create table if not exists photos (
     id uuid primary key default gen_random_uuid(),
     url text not null,
     path text not null,
     caption text,
     uploader text,
     created_at timestamptz default now()
   );
   ```

3. **Storage** → **New bucket** → নাম দাও `photos` → **Public bucket** চালু করে create করো।
4. **Project Settings → API** থেকে দুটো জিনিস কপি করো:
   - `Project URL` → `SUPABASE_URL`
   - `service_role` key (secret) → `SUPABASE_SERVICE_ROLE_KEY`

> ⚠️ `service_role` key শুধু সার্ভারে ব্যবহার হয় (এই অ্যাপের API route-এ), কখনো ক্লায়েন্টে যায় না। এটা গোপন রাখো।

---

## ২. Vercel-এ ডিপ্লয়

1. কোডটা GitHub রিপোতে push করো, তারপর [vercel.com](https://vercel.com) → **Add New → Project** → import করো।
2. **Settings → Environment Variables**-এ তিনটা যোগ করো:

   | Name | Value |
   |---|---|
   | `SUPABASE_URL` | তোমার Supabase project URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role key |
   | `OWNER_PASSWORD` | তুমি যে পাসওয়ার্ড দিয়ে এডিট করবে |

3. **Deploy** চাপো। এরপর লিংকটা বন্ধুদের পাঠিয়ে দাও।

ম্যানেজ করতে: সাইটে গিয়ে উপরে-ডানে **ম্যানেজ** → পাসওয়ার্ড দাও। তখন এডিট অপশন আসবে। বন্ধুরা পাসওয়ার্ড ছাড়া শুধু দেখতে পাবে।

---

## লোকালি চালানো

`.env.local` ফাইল বানিয়ে (`.env.example` দেখো) মান বসাও, তারপর:

```bash
npm install
npm run dev
```

http://localhost:3000

---

## টেক

Next.js 14 (App Router) · TypeScript · React 18 · Tailwind CSS · Supabase (Postgres + Storage) · lucide-react

লেখা (expense) সব সার্ভার-সাইড API route দিয়ে হয় এবং ম্যানেজার পাসওয়ার্ড দিয়ে যাচাই করা হয়, তাই বন্ধুরা শুধু পড়তে পারে। ছবি আপলোড সবার জন্য খোলা।
