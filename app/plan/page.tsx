import type { Metadata } from 'next';
import { PLAN_DAYS as DAYS, KIT } from '../../lib/site';

export const metadata: Metadata = { title: 'ট্যুর প্ল্যান — সাজেক' };

export default function PlanPage() {
  return (
    <div className="mx-auto max-w-4xl p-4 pb-24">
      <header className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-700 text-white rounded-2xl p-6 text-center mb-5 shadow-lg shadow-emerald-900/20">
        <p className="text-amber-300 text-xs font-semibold tracking-widest">মেঘের রাজ্যে</p>
        <h1 className="text-3xl font-bold mt-1">সাজেক ট্যুর প্ল্যান</h1>
        <p className="text-emerald-100 text-sm mt-1">ঢাকা → খাগড়াছড়ি → সাজেক ভ্যালি</p>
        <div className="flex justify-center gap-2 mt-4 flex-wrap">
          {['২ দিন ৩ রাত', '২৫–২৭ জুন', '৬–৭ জন'].map((c) => (
            <span key={c} className="bg-amber-200 text-emerald-900 text-sm font-medium rounded-full px-3 py-1">
              {c}
            </span>
          ))}
        </div>
      </header>

      {DAYS.map((d) => (
        <section key={d.no} className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 mb-4">
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-bold text-amber-600">{d.no}</span>
            <h2 className="text-lg font-bold text-emerald-900">{d.title}</h2>
          </div>
          <p className="text-sm text-stone-500 ml-9 mb-3">{d.route}</p>
          <ul className="ml-9 space-y-2.5">
            {d.stops.map((s, i) => (
              <li key={i} className="relative pl-5 text-sm leading-relaxed">
                <span className={'absolute left-0 top-2 w-2 h-2 rounded-full ' + (s.hl ? 'bg-amber-500' : 'bg-stone-300')} />
                <span className="font-semibold text-amber-700 mr-2">{s.t}</span>
                <span className="text-stone-700">{s.a}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="bg-emerald-900 text-white rounded-2xl p-5">
        <h2 className="font-bold text-lg mb-3">সাথে যা যা মাস্ট</h2>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
          {KIT.map((k) => (
            <li key={k} className="flex items-start gap-2 text-sm">
              <span className="text-amber-400 font-bold">›</span>
              <span className="text-emerald-50">{k}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
