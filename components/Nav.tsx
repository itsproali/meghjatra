'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { MountainSnow, Wallet, Map, Image as ImageIcon, Lock, LogOut, ShieldCheck, type LucideIcon } from 'lucide-react';
import { useOwner } from './OwnerProvider';
import { BRAND } from '../lib/site';

interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

const links: NavLink[] = [
  { href: '/cost', label: 'হিসাব', icon: Wallet },
  { href: '/gallery', label: 'ছবি', icon: ImageIcon },
  { href: '/plan', label: 'প্ল্যান', icon: Map },
];

export default function Nav() {
  const path = usePathname();
  const { isOwner, login, logout } = useOwner();
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState('');
  const [err, setErr] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setErr(false);
    const ok = await login(pw);
    setBusy(false);
    if (ok) {
      setOpen(false);
      setPw('');
    } else {
      setErr(true);
    }
  }

  return (
    <header className="bg-emerald-900/90 backdrop-blur-md text-white sticky top-0 z-20 border-b border-emerald-800/40 supports-[backdrop-filter]:bg-emerald-900/80">
      <div className="mx-auto max-w-4xl px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2">
        <Link href="/" className="flex items-center gap-1.5 font-bold text-white shrink-0" title="হোম">
          <MountainSnow size={20} className="text-amber-300 shrink-0" />
          <span className="text-base tracking-tight">{BRAND.name}</span>
        </Link>

        <div className="flex items-center gap-1">
          <nav className="flex gap-0.5">
            {links.map((l) => {
              const A = l.icon;
              const on = path === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={
                    'flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors ' +
                    (on ? 'bg-white text-emerald-900' : 'text-emerald-100 hover:bg-emerald-800')
                  }
                  title={l.label}
                >
                  <A size={16} className="shrink-0" />
                  <span className="hidden sm:inline">{l.label}</span>
                </Link>
              );
            })}
          </nav>

          <span className="w-px h-5 bg-emerald-700/60 mx-1" />

          {isOwner ? (
            <button
              onClick={logout}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm bg-amber-300 text-emerald-900 font-medium shrink-0 transition-colors hover:bg-amber-200"
              title="লগ আউট"
            >
              <ShieldCheck size={15} /> <span className="hidden sm:inline">ম্যানেজার</span>
              <LogOut size={14} className="sm:ml-0.5" />
            </button>
          ) : (
            <button
              onClick={() => setOpen(true)}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-emerald-100 hover:bg-emerald-800 shrink-0 transition-colors"
              title="ম্যানেজার লগইন"
            >
              <Lock size={15} /> <span className="hidden sm:inline">ম্যানেজ</span>
            </button>
          )}
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setOpen(false)}>
          <div className="bg-white text-stone-800 rounded-2xl shadow-2xl w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold flex items-center gap-2">
              <Lock size={18} /> ম্যানেজার লগইন
            </h3>
            <p className="text-sm text-stone-500 mt-1">পাসওয়ার্ড দিলে তুমি হিসাব এডিট করতে পারবে। বন্ধুরা শুধু দেখতে পাবে।</p>
            <input
              type="password"
              value={pw}
              autoFocus
              onChange={(e) => setPw(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="পাসওয়ার্ড"
              className="mt-3 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
            />
            {err && <p className="text-sm text-rose-600 mt-2">পাসওয়ার্ড ঠিক হয়নি।</p>}
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setOpen(false)} className="rounded-lg px-4 py-2 text-sm text-stone-600 hover:bg-stone-100">
                বাতিল
              </button>
              <button onClick={submit} disabled={busy} className="rounded-lg px-4 py-2 text-sm bg-emerald-700 text-white disabled:opacity-60">
                {busy ? '...' : 'লগইন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
