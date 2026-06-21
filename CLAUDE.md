# CLAUDE.md — সাজেক ট্যুর অ্যাপ (প্রজেক্ট কনটেক্সট)

> এই ফাইলটা প্রজেক্টের পূর্ণ প্রেক্ষাপট। যেকোনো AI অ্যাসিস্ট্যান্ট (Claude Code এটা অটো-পড়ে) কাজ শুরুর আগে এটা পড়ে নিলে আগের সব সিদ্ধান্ত বুঝে যাবে।
> ইউজার Banglish/বাংলায় কথা বলে — উত্তরও সেভাবে দাও। অ্যাপের সব UI টেক্সট বাংলায়।

## কী এই অ্যাপ
ঢাকা → সাজেক ভ্যালি গ্রুপ ট্যুরের (৬–৭ জন, ২৫–২৭ জুন ২০২৬) জন্য একটা ছোট Next.js ওয়েব অ্যাপ। চারটা পেজ:
- `/` — **ল্যান্ডিং হোম** (`Home.tsx`): হিরো + কাউন্টডাউন, খরচের লাইভ সারাংশ, ছবির প্রিভিউ, প্ল্যান টিজার, জরুরি ট্যুর তথ্য।
- `/cost` — **খরচের হিসাব** (`CostManager`): সবাই দেখতে পারে; শুধু ম্যানেজার (ওনার) পাসওয়ার্ড দিয়ে এডিট করে।
- `/gallery` — **ছবি শেয়ার**: যে কেউ আপলোড করে; সবাই দেখে ও ডাউনলোড করে।
- `/plan` — **ট্যুর প্ল্যান**: স্ট্যাটিক ৩-দিনের itinerary।

Vercel-এ ডিপ্লয় করার জন্য বানানো। ব্যাকএন্ড: **Supabase Postgres** (টেক্সট/মেটাডেটা) + **Cloudflare R2** (ছবির ফাইল, ৯GB হার্ড লিমিট)।

## টেক স্ট্যাক
Next.js 14 (App Router) · **TypeScript (strict)** · React 18 · Tailwind CSS 3 · Supabase JS · `@aws-sdk/client-s3` (R2) · lucide-react. ফন্ট: Noto Sans Bengali (Google Fonts, `<link>` দিয়ে — `next/font` ব্যবহার করা হয়নি, কারণ বিল্ড-টাইম ফেচ এড়াতে)।

## রান করার কমান্ড
```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # প্রোডাকশন বিল্ড (বিল্ডের সময় TypeScript টাইপ-চেক হয়)
```
লোকালি চালাতে হলে `.env.local` লাগবে (নিচে দেখো)। `.env.example` কপি করে মান বসাও।

## আর্কিটেকচার ও ডেটা ফ্লো
- সব ডেটা-অ্যাক্সেস Next.js **API route** দিয়ে সার্ভার-সাইডে হয়; ক্লায়েন্ট সরাসরি Supabase-এ কথা বলে না।
- সার্ভার Supabase-এর **service_role key** দিয়ে কাজ করে (`lib/supabase.ts` → `admin()`)। তাই RLS পলিসি লাগে না, anon key ক্লায়েন্টে যায় না।
- **রিড সবার জন্য খোলা** (GET)। **এক্সপেন্স রাইট শুধু ওনার** — POST/DELETE-এ `x-owner-key` হেডার `OWNER_PASSWORD`-এর সাথে মেলানো হয় (`isOwnerRequest()`)।
- **ছবি আপলোড সবার জন্য খোলা** (কোনো পাসওয়ার্ড লাগে না)। ছবি **ডিলিট শুধু ওনার**।
- **ছবির ফাইল Cloudflare R2-তে** (`lib/r2.ts` → S3-compatible client)। মেটাডেটা (url/path/caption/uploader) Supabase `photos` টেবিলে। আপলোডের আগে R2 bucket list করে মোট সাইজ মেপে **৯GB হার্ড লিমিট** চেক হয় (`r2TotalBytes()`), ছাড়ালে 413।
- ক্লায়েন্টে এক্সপেন্স আপডেট **optimistic**: state আপডেট করে সাথে সাথে `POST /api/data`-তে পুরো state পাঠানো হয় (`mutate()` → `persist()` in `CostManager.tsx`)।

## অথ মডেল
- ওনার পাসওয়ার্ড = env `OWNER_PASSWORD`। Nav-এর "ম্যানেজ" বাটনে পাসওয়ার্ড দিলে `OwnerProvider` সেটা localStorage-এ (`sajek-owner-key`) রাখে আর `/api/verify` দিয়ে যাচাই করে।
- `useOwner()` হুক দিয়ে `isOwner` ও `ownerKey` পাওয়া যায়। `isOwner` false হলে এডিট/ডিলিট UI দেখায় না (ভিউ মোড)।
- আসল সুরক্ষা সার্ভারে: UI লুকানো থাক বা না থাক, রাইট রিকোয়েস্ট পাসওয়ার্ড ছাড়া 401 দেয়।

## ফাইল ম্যাপ
```
app/
  layout.tsx              রুট লেআউট; ফন্ট <link>; OwnerProvider + Nav র‍্যাপ
  page.tsx                হোম → <Home/>
  cost/page.tsx           → <CostManager/> (খরচের হিসাব)
  gallery/page.tsx        → <Gallery/>
  plan/page.tsx           স্ট্যাটিক itinerary (DAYS, KIT অ্যারে এখানে এডিট করো)
  globals.css             Tailwind directives + body font-family
  api/
    data/route.ts         GET state (public) / POST state (owner)
    verify/route.ts       POST {password} → {ok}
    photos/route.ts       GET list (Supabase) / POST upload → R2 + ৯GB গার্ড
    photos/[id]/route.ts  DELETE → R2 থেকে ফাইল + DB row (owner)
components/
  Home.tsx                ল্যান্ডিং হোম (হিরো/কাউন্টডাউন/সারাংশ/ছবি প্রিভিউ/তথ্য)
  Nav.tsx                 ৪ লিংক (হোম/হিসাব/ছবি/প্ল্যান) + ওনার লগইন মডাল
  CostManager.tsx         হিসাবের মূল লজিক (Dash/Give/Spend/Split সাব-কম্পোনেন্ট)
  Gallery.tsx             আপলোড ফর্ম + গ্রিড + ডাউনলোড + ওনার ডিলিট
  ConfirmDialog.tsx       রিইউজেবল কনফার্ম মডাল
  OwnerProvider.tsx       ওনার অথ কনটেক্সট (useOwner)
lib/
  site.ts                 ⭐ সব এডিটযোগ্য কনটেন্ট: BRAND, TRIP, PLAN_DAYS, KIT, PRE_TRIP_INFO, PLAN_TEASER, toBn
  types.ts                Member, Contribution, Expense, TripState, Photo
  supabase.ts             admin() ক্লায়েন্ট, isOwnerRequest()
  r2.ts                   R2 S3 client; r2Upload/r2Delete/r2Get/r2TotalBytes; publicUrl(); STORAGE_LIMIT=৯GB
```
> **ছবির URL**: `publicUrl(key)` — `R2_PUBLIC_URL` ঠিকঠাক পাবলিক হোস্ট হলে (`pub-xxxx.r2.dev`/কাস্টম ডোমেইন) সরাসরি সেই URL (egress ফ্রি)। কিন্তু `R2_PUBLIC_URL` খালি বা ভুল করে S3 endpoint (`*.r2.cloudflarestorage.com`) সেট থাকলে — যেটা কখনো পাবলিক না — তখন আপনাআপনি `/api/img/<key>` প্রক্সি দিয়ে সার্ভ হয় (`app/api/img/[...key]/route.ts` → `r2Get`)। GET `/api/photos` সবসময় `path` থেকে `publicUrl()` দিয়ে url বানায়, DB-র সেভ করা পুরোনো url-এর উপর নির্ভর করে না। ছবি key folder-prefixed (`<album>/<file>`); publicUrl প্রতিটা সেগমেন্ট এনকোড করে।
> ব্র্যান্ড নাম, ট্রিপ তারিখ/রুট, প্ল্যান, কিট, জরুরি তথ্য — সব **`lib/site.ts`**-এ। কনটেন্ট বদলাতে শুধু ওই ফাইলটা এডিট করো; Home/Plan/Nav/layout ওখান থেকেই নেয়।

## ডেটা মডেল (`lib/types.ts`)
- `Member { id, name }`
- `Contribution { id, memberId, amount, note? }`
- `Expense { id, amount, desc, category|null, paidBy|null, ts? }`
- `TripState { members[], contributions[], expenses[] }` — পুরোটা `app_state` টেবিলের একটা jsonb row (id=1)-এ থাকে।
- `Photo { id, url, caption?, uploader?, folder?, created_at? }` — মেটাডেটা `photos` টেবিলে (`path` = R2 object key); আসল ফাইল R2 bucket-এ। `folder` = অ্যালবাম নাম (আপলোডে বাধ্যতামূলক, সর্বোচ্চ ১৫টা আলাদা অ্যালবাম — `MAX_FOLDERS` Gallery.tsx + photos/route.ts দুই জায়গায়)।
হিসাব: জনপ্রতি ভাগ = মোট খরচ ÷ সদস্য সংখ্যা; ব্যালান্স = (কারো জমা − ভাগ) → পজিটিভ মানে "ফেরত পাবে"। কারেন্সি ফরম্যাট `৳` + en-US রাউন্ডেড।

## এনভায়রনমেন্ট ভ্যারিয়েবল
```
SUPABASE_URL=...                  # Supabase Project Settings → API
SUPABASE_SERVICE_ROLE_KEY=...     # service_role (secret, সার্ভার-অনলি)
OWNER_PASSWORD=...                # তোমার ম্যানেজার পাসওয়ার্ড
R2_ACCOUNT_ID=...                 # শুধু ID অংশ (পুরো endpoint URL দিলেও r2.ts নিজে বের করে নেয়)
R2_ACCESS_KEY_ID=...              # R2 API token (Object Read & Write)
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=sajek-photos
R2_PUBLIC_URL=https://pub-xxxx.r2.dev   # bucket Settings → Public access (R2.dev)
```

## Supabase সেটআপ (একবার)
1. supabase.com-এ project খোলো।
2. SQL Editor-এ চালাও:
```sql
create extension if not exists "pgcrypto";
create table if not exists app_state (
  id int primary key,
  data jsonb not null default '{"members":[],"contributions":[],"expenses":[]}'
);
insert into app_state (id) values (1) on conflict (id) do nothing;
create table if not exists photos (
  id uuid primary key default gen_random_uuid(),
  url text not null, path text not null,
  caption text, uploader text, folder text,
  created_at timestamptz default now()
);
-- আগের DB-তে folder কলাম না থাকলে: alter table photos add column if not exists folder text;
```
3. URL + service_role key কপি করে env-এ বসাও (লোকালি `.env.local`, Vercel-এ Environment Variables)।
   (ছবির ফাইল আর Supabase Storage-এ নেই — R2-তে; নিচের ধাপ দেখো।)

## Cloudflare R2 সেটআপ (একবার, ছবির ফাইলের জন্য)

1. dash.cloudflare.com → R2 enable (verification-এ একটা কার্ড লাগে; ৯GB-র মধ্যে থাকলে চার্জ নেই, egress ফ্রি)।
2. Bucket বানাও (যেমন `sajek-photos`)।
3. Bucket → Settings → Public access → **R2.dev subdomain** allow → পাবলিক URL (`https://pub-xxxx.r2.dev`) কপি করো → `R2_PUBLIC_URL`।
4. Manage R2 API Tokens → **Object Read & Write** টোকেন → Access Key ID / Secret / Account ID env-এ বসাও।

নোট: `R2_ACCOUNT_ID`-এ শুধু ID দাও (`xxxx.r2.cloudflarestorage.com`-এর `xxxx` অংশ); পুরো URL দিলেও `r2.ts` regex দিয়ে ID বের করে নেয়।

## কনভেনশন ও সতর্কতা (গুরুত্বপূর্ণ)
- **Tailwind content glob-এ অবশ্যই `ts,tsx` রাখতে হবে** (`tailwind.config.js`) — নাহলে ক্লাস purge হয়ে স্টাইল চলে যায়।
- নতুন ফাইল `.ts`/`.tsx`-এই বানাও; প্রপস ও state টাইপ করো (strict অন)।
- **প্রতিটা delete/remove অ্যাকশনে `ConfirmDialog` দেখাতেই হবে** — এটা ইউজারের পরিষ্কার দাবি। নতুন ডিলিট ফিচার যোগ করলেও এই নিয়ম রাখো।
- API route-এ `export const dynamic = 'force-dynamic'` রাখা আছে — হাটানো যাবে না (নাহলে স্ট্যাটিক হয়ে env মিস করবে)।
- service_role key কখনো ক্লায়েন্ট কোডে/`NEXT_PUBLIC_`-এ আনবে না।
- বিল্ডে `fonts.googleapis ... CssSyntaxError` দেখা গেলে সেটা শুধু কিছু স্যান্ডবক্স/অফলাইন এনভে নেটওয়ার্ক নয়েজ — exit code 0 হলে বিল্ড ঠিক আছে; Vercel-এ সমস্যা নেই।

## ট্রিপ তথ্য (plan পেজ এডিট করলে কাজে লাগবে)
- ৬–৭ জন, ঢাকা→খাগড়াছড়ি→সাজেক, ২ দিন ৩ রাত, ২৫ জুন রাত ১০–১১টা বাসে রওনা।
- **আর্মি এসকর্ট**: উপরে ওঠার দিন (Day 1) এসকর্ট ছাড়ে **বাঘাইহাট** থেকে ~১০:৩০ ও ~৩:৩০; নামার দিন (Day 2) এসকর্ট ছাড়ে **সাজেক** থেকে ~১০টা ও ~৩টা।
- NID ফটোকপি লাগে; শুধু Robi/Airtel/Teletalk নেটওয়ার্ক; সাজেকে ATM নেই; বিদ্যুৎ সীমিত (পাওয়ার ব্যাংক)।
- খাগড়াছড়ির স্পট: itinerary-তে আগে **রিসাং ঝর্ণা** (~২:৪৫) তারপর **আলুটিলা** (~৪:১৫, ভিউ + ঝুলন্ত ব্রিজ + গুহা)। Day 2 চেকআউট ৯:৩০।
- Essentials-এ "ছাতা" আছে (রেইনকোট নয়)। বর্ষায় ভূমিধসের ঝুঁকি — তবে plan পেজের নিচে আলাদা সতর্কতা ফুটার ইচ্ছাকৃতভাবে রাখা হয়নি।

## সম্ভাব্য পরের কাজ (ইউজার চাইলে)
- প্রতি বন্ধুর আলাদা লগইন (এখন একটাই ওনার পাসওয়ার্ড)।
- খরচে কে কে ভাগ নেবে সেটা বেছে নেওয়া (এখন সমান n-ভাগ)।
- Realtime আপডেট (Supabase realtime) যাতে রিফ্রেশ ছাড়াই সবার স্ক্রিনে আপডেট আসে।
- ছবিতে আপলোডার-ভিত্তিক ডিলিট, বা lightbox ভিউ।

## লোকাল পাথ
ইউজারের মেশিনে: `/Users/ali/Downloads/sajek-tour-app`
পড়ার সময় উপেক্ষা করো: `node_modules/`, `.next/`, `package-lock.json`।
