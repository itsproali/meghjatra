'use client';

import { useState, useEffect, useMemo, Fragment } from 'react';
import Link from 'next/link';
import {
  MountainSnow, Cloud, Calendar, Users, ArrowRight, MapPin, Wallet,
  PiggyBank, TrendingDown, Camera, Map, ShieldAlert, ImagePlus, type LucideIcon,
} from 'lucide-react';
import type { TripState, Photo } from '../lib/types';
import { BRAND, TRIP, PLAN_TEASER, PRE_TRIP_INFO, toBn } from '../lib/site';

const fmt = (n: number) => '৳' + Math.round(n).toLocaleString('en-US');
const DEPART = new Date(TRIP.departIso);

export default function Home() {
  const [trip, setTrip] = useState<TripState | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 60_000); // live countdown
    fetch('/api/data', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j: Partial<TripState>) => setTrip({ members: [], contributions: [], expenses: [], ...j }))
      .catch(() => {});
    fetch('/api/photos', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j: Photo[]) => setPhotos(Array.isArray(j) ? j : []))
      .catch(() => {});
    return () => clearInterval(t);
  }, []);

  const calc = useMemo(() => {
    if (!trip) return null;
    const fund = trip.contributions.reduce((s, c) => s + c.amount, 0);
    const spent = trip.expenses.reduce((s, e) => s + e.amount, 0);
    const n = trip.members.length || 1;
    return { fund, spent, remaining: fund - spent, share: spent / n, members: trip.members.length };
  }, [trip]);

  const diff = now ? DEPART.getTime() - now.getTime() : 0;
  const days = now ? Math.floor(diff / 86400000) : null;
  const hours = now ? Math.floor((diff % 86400000) / 3600000) : 0;

  return (
    <div className="mx-auto max-w-4xl p-4 pb-24 space-y-5">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-700 text-white p-6 sm:p-8 shadow-lg shadow-emerald-900/20">
        <Cloud className="absolute -top-4 -right-3 text-white/10" size={150} strokeWidth={1} />
        <MountainSnow className="absolute -bottom-6 -left-4 text-white/10" size={150} strokeWidth={1} />
        <div className="relative">
          <p className="text-amber-300 text-xs font-semibold tracking-[0.2em] uppercase">{BRAND.tagline}</p>
          <h1 className="text-3xl sm:text-4xl font-bold mt-1.5">{TRIP.heroTitle}</h1>

          {/* route stepper */}
          <div className="flex items-center flex-wrap gap-x-1.5 gap-y-1 mt-3 text-sm text-emerald-50">
            {TRIP.route.map((r, i) => (
              <Fragment key={r}>
                <span className="inline-flex items-center gap-1">
                  <MapPin size={13} className="text-amber-300" /> {r}
                </span>
                {i < TRIP.route.length - 1 && <ArrowRight size={13} className="text-emerald-300/70" />}
              </Fragment>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {TRIP.chips.map((c) => (
              <span key={c} className="bg-white/15 backdrop-blur text-white text-xs font-medium rounded-full px-3 py-1">
                {c}
              </span>
            ))}
          </div>

          {/* countdown */}
          <div className="mt-5 bg-white/10 backdrop-blur rounded-2xl px-4 py-3.5 flex items-center justify-between">
            {days === null ? (
              <span className="text-emerald-100 text-sm">যাত্রার দিন গোনা হচ্ছে…</span>
            ) : days > 0 ? (
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold leading-none">{toBn(days)}</span>
                <span className="text-sm text-emerald-100">দিন {hours > 0 && `${toBn(hours)} ঘণ্টা`} বাকি</span>
              </div>
            ) : days === 0 && diff > 0 ? (
              <p className="text-xl font-bold">আজই যাত্রা! 🎒 আর {toBn(hours)} ঘণ্টা</p>
            ) : diff > -2 * 86400000 ? (
              <p className="text-lg font-bold">ট্যুর চলছে — মেঘ উপভোগ করো ☁️</p>
            ) : (
              <p className="text-lg font-bold">ট্যুর শেষ — স্মৃতিগুলো ছবিতে 📸</p>
            )}
            <Calendar className="text-amber-300 shrink-0" size={28} />
          </div>

          <div className="flex gap-2 mt-4">
            <Link href="/plan" className="flex-1 flex items-center justify-center gap-1.5 bg-amber-300 text-emerald-900 font-semibold rounded-xl py-2.5 text-sm transition-transform active:scale-[0.98] hover:bg-amber-200">
              <Map size={16} /> পুরো প্ল্যান
            </Link>
            <Link href="/gallery" className="flex-1 flex items-center justify-center gap-1.5 bg-white/15 backdrop-blur text-white font-semibold rounded-xl py-2.5 text-sm transition-colors hover:bg-white/25">
              <Camera size={16} /> ছবি শেয়ার
            </Link>
          </div>
        </div>
      </section>

      {/* Cost summary */}
      <section>
        <SectionHead icon={Wallet} title="খরচের সারাংশ" href="/cost" cta="বিস্তারিত হিসাব" />
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="grid grid-cols-3 divide-x divide-stone-100">
            <SummaryCell icon={PiggyBank} label="মোট জমা" value={calc ? fmt(calc.fund) : '—'} tone="text-emerald-700" />
            <SummaryCell icon={TrendingDown} label="মোট খরচ" value={calc ? fmt(calc.spent) : '—'} tone="text-rose-600" />
            <SummaryCell icon={Wallet} label="অবশিষ্ট" value={calc ? fmt(calc.remaining) : '—'} tone={calc && calc.remaining < 0 ? 'text-rose-600' : 'text-amber-600'} />
          </div>
          {calc && calc.members > 0 && (
            <div className="flex items-center justify-between bg-stone-50 border-t border-stone-100 px-4 py-2.5 text-sm">
              <span className="flex items-center gap-1.5 text-stone-500">
                <Users size={14} /> {toBn(calc.members)} জন
              </span>
              <span className="text-stone-600">জনপ্রতি ভাগ <b className="text-stone-800">{fmt(calc.share)}</b></span>
            </div>
          )}
        </div>
      </section>

      {/* Photo preview */}
      <section>
        <SectionHead icon={Camera} title="ট্যুরের ছবি" badge={photos.length || undefined} href="/gallery" cta="সব ছবি" />
        {photos.length === 0 ? (
          <Link href="/gallery" className="flex flex-col items-center justify-center gap-2 bg-white border border-dashed border-stone-300 rounded-2xl py-10 text-stone-400 transition-colors hover:border-emerald-400 hover:text-emerald-600">
            <ImagePlus size={28} />
            <span className="text-sm">এখনো ছবি নেই — প্রথম ছবিটা তুমিই দাও</span>
          </Link>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {photos.slice(0, 6).map((p) => (
              <Link key={p.id} href="/gallery" className="group block aspect-square rounded-xl overflow-hidden bg-stone-200 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={p.caption || 'ছবি'} loading="lazy" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Plan teaser (timeline) */}
      <section>
        <SectionHead icon={Map} title="সংক্ষিপ্ত প্ল্যান" href="/plan" cta="বিস্তারিত" />
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 sm:p-5">
          <ol className="relative border-l-2 border-emerald-100 ml-3 space-y-4">
            {PLAN_TEASER.map((d) => (
              <li key={d.no} className="relative pl-5">
                <span className="absolute -left-[15px] top-0 w-7 h-7 rounded-full bg-emerald-700 text-white text-xs font-bold flex items-center justify-center ring-4 ring-white">
                  {d.no}
                </span>
                <p className="font-semibold text-emerald-900 text-sm">{d.title}</p>
                <p className="text-xs text-stone-500 mt-0.5">{d.detail}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Pre-trip info */}
      <section>
        <h2 className="flex items-center gap-2 font-semibold text-stone-700 mb-2 px-1">
          <ShieldAlert size={18} className="text-amber-600" /> যাওয়ার আগে জেনে রাখো
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {PRE_TRIP_INFO.map((it) => (
            <InfoCard key={it.title} item={it} />
          ))}
        </div>
      </section>

      <footer className="text-center text-xs text-stone-400 pt-2">{TRIP.footer}</footer>
    </div>
  );
}

function SectionHead({ icon: Icon, title, href, cta, badge }: { icon: LucideIcon; title: string; href: string; cta: string; badge?: number }) {
  return (
    <div className="flex items-center justify-between mb-2 px-1">
      <h2 className="flex items-center gap-2 font-semibold text-stone-700">
        <Icon size={18} className="text-emerald-700" /> {title}
        {badge ? <span className="text-xs font-medium text-emerald-700 bg-emerald-50 rounded-full px-2 py-0.5">{toBn(badge)}</span> : null}
      </h2>
      <Link href={href} className="flex items-center gap-0.5 text-sm text-emerald-700 font-medium hover:text-emerald-900">
        {cta} <ArrowRight size={14} />
      </Link>
    </div>
  );
}

function SummaryCell({ icon: Icon, label, value, tone }: { icon: LucideIcon; label: string; value: string; tone: string }) {
  return (
    <div className="p-3.5">
      <div className="flex items-center gap-1.5 text-stone-500 mb-1">
        <Icon size={15} />
        <span className="text-xs">{label}</span>
      </div>
      <div className={'text-lg font-bold ' + tone}>{value}</div>
    </div>
  );
}

function InfoCard({ item: { icon: Icon, title, body } }: { item: { icon: LucideIcon; title: string; body: string } }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4">
      <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm mb-1.5">
        <Icon size={16} className="text-amber-600" /> {title}
      </div>
      <p className="text-xs text-stone-600 leading-relaxed">{body}</p>
    </div>
  );
}
