"use client";

import { useState, useEffect, useMemo, ReactNode } from "react";
import {
  Wallet,
  TrendingDown,
  PiggyBank,
  Plus,
  Trash2,
  Receipt,
  Scale,
  X,
  HandCoins,
  Eye,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import ConfirmDialog from "./ConfirmDialog";
import { useOwner } from "./OwnerProvider";
import type { Member, Contribution, Expense, TripState } from "../lib/types";

const EMPTY: TripState = { members: [], contributions: [], expenses: [] };
const CATS = ["যাতায়াত", "খাবার", "রিসোর্ট", "অ্যাক্টিভিটি", "অন্যান্য"];

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const fmt = (n: number) => "৳" + Math.round(n).toLocaleString("en-US");

interface Balance extends Member {
  given: number;
  share: number;
  balance: number;
}
interface Calc {
  fund: number;
  spent: number;
  remaining: number;
  share: number;
  balances: Balance[];
  byCat: Record<string, number>;
}
interface ConfirmState {
  title: string;
  message: string;
  onYes: () => void;
}

export default function CostManager() {
  const { isOwner, ownerKey } = useOwner();
  const [data, setData] = useState<TripState>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"dash" | "give" | "spend" | "split">("dash");
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/data", { cache: "no-store" });
        const j = (await r.json()) as Partial<TripState>;
        setData({ ...EMPTY, ...j });
      } catch {
        /* keep empty */
      }
      setLoading(false);
    })();
  }, []);

  function persist(next: TripState) {
    fetch("/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-owner-key": ownerKey },
      body: JSON.stringify(next),
    }).catch(() => {});
  }
  function mutate(fn: (prev: TripState) => TripState) {
    setData((prev) => {
      const next = fn(prev);
      persist(next);
      return next;
    });
  }

  const calc: Calc = useMemo(() => {
    const fund = data.contributions.reduce((s, c) => s + c.amount, 0);
    const spent = data.expenses.reduce((s, e) => s + e.amount, 0);
    const n = data.members.length || 1;
    const share = spent / n;
    const givenBy: Record<string, number> = {};
    data.members.forEach((m) => (givenBy[m.id] = 0));
    data.contributions.forEach((c) => (givenBy[c.memberId] = (givenBy[c.memberId] || 0) + c.amount));
    const balances: Balance[] = data.members.map((m) => ({
      ...m,
      given: givenBy[m.id] || 0,
      share,
      balance: (givenBy[m.id] || 0) - share,
    }));
    const byCat: Record<string, number> = {};
    data.expenses.forEach((e) => {
      const k = e.category || "অন্যান্য";
      byCat[k] = (byCat[k] || 0) + e.amount;
    });
    return { fund, spent, remaining: fund - spent, share, balances, byCat };
  }, [data]);

  const addMember = (name: string) => mutate((d) => ({ ...d, members: [...d.members, { id: uid(), name }] }));
  const addContribution = (c: Omit<Contribution, "id">) =>
    mutate((d) => ({ ...d, contributions: [{ id: uid(), ...c }, ...d.contributions] }));
  const addExpense = (e: Omit<Expense, "id" | "ts">) =>
    mutate((d) => ({ ...d, expenses: [{ id: uid(), ts: Date.now(), ...e }, ...d.expenses] }));

  const doDelMember = (id: string) =>
    mutate((d) => ({
      ...d,
      members: d.members.filter((m) => m.id !== id),
      contributions: d.contributions.filter((c) => c.memberId !== id),
      expenses: d.expenses.map((e) => (e.paidBy === id ? { ...e, paidBy: null } : e)),
    }));
  const doDelContribution = (id: string) => mutate((d) => ({ ...d, contributions: d.contributions.filter((c) => c.id !== id) }));
  const doDelExpense = (id: string) => mutate((d) => ({ ...d, expenses: d.expenses.filter((e) => e.id !== id) }));

  const nameOf = (id: string | null) => data.members.find((m) => m.id === id)?.name || "—";

  const askDelMember = (m: Member) =>
    setConfirm({ title: "সদস্য মুছবেন?", message: `"${m.name}" এবং তার সব জমা মুছে যাবে।`, onYes: () => doDelMember(m.id) });
  const askDelContribution = (c: Contribution) =>
    setConfirm({
      title: "জমা মুছবেন?",
      message: `${nameOf(c.memberId)} — ${fmt(c.amount)} জমা মুছে যাবে।`,
      onYes: () => doDelContribution(c.id),
    });
  const askDelExpense = (e: Expense) =>
    setConfirm({ title: "খরচ মুছবেন?", message: `"${e.desc || "খরচ"}" — ${fmt(e.amount)} মুছে যাবে।`, onYes: () => doDelExpense(e.id) });

  const tabs: { k: typeof tab; label: string; icon: LucideIcon }[] = [
    { k: "dash", label: "ড্যাশবোর্ড", icon: Wallet },
    { k: "give", label: "জমা", icon: HandCoins },
    { k: "spend", label: "খরচ", icon: Receipt },
    { k: "split", label: "ভাগ", icon: Scale },
  ];

  return (
    <div className="mx-auto max-w-4xl p-4 pb-24">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-emerald-900">খরচের হিসাব</h1>
        <p className="text-sm text-stone-500">কে কত দিল, কত খরচ হলো, কত বাকি আছে</p>
      </header>

      {!isOwner && (
        <div className="flex items-center gap-2 text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-3 py-2 mb-4">
          <Eye size={15} /> তুমি ভিউ মোডে আছো
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 text-stone-400 py-16">
          <Loader2 size={18} className="animate-spin" /> লোড হচ্ছে…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 mb-5">
            <Stat icon={PiggyBank} label="মোট জমা" value={fmt(calc.fund)} tone="emerald" />
            <Stat icon={TrendingDown} label="মোট খরচ" value={fmt(calc.spent)} tone="rose" />
            <Stat icon={Wallet} label="অবশিষ্ট" value={fmt(calc.remaining)} tone={calc.remaining < 0 ? "rose" : "amber"} />
          </div>

          <nav className="flex gap-1 mb-4 bg-white rounded-xl border border-stone-200 shadow-sm p-1">
            {tabs.map((t) => {
              const A = t.icon;
              const on = tab === t.k;
              return (
                <button
                  key={t.k}
                  onClick={() => setTab(t.k)}
                  className={
                    "flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-colors " +
                    (on ? "bg-emerald-700 text-white" : "text-stone-600 hover:bg-stone-100")
                  }
                >
                  <A size={16} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </nav>

          {tab === "dash" && <Dash calc={calc} data={data} />}
          {tab === "give" && (
            <Give
              canEdit={isOwner}
              members={data.members}
              contributions={data.contributions}
              nameOf={nameOf}
              balances={calc.balances}
              onAddMember={addMember}
              onDelMember={askDelMember}
              onAdd={addContribution}
              onDel={askDelContribution}
            />
          )}
          {tab === "spend" && (
            <Spend
              canEdit={isOwner}
              members={data.members}
              expenses={data.expenses}
              nameOf={nameOf}
              onAdd={addExpense}
              onDel={askDelExpense}
            />
          )}
          {tab === "split" && <Split calc={calc} count={data.members.length} />}
        </>
      )}

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        onConfirm={() => {
          confirm?.onYes();
          setConfirm(null);
        }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

function Stat({ icon: Icon, label, value, tone }: { icon: LucideIcon; label: string; value: string; tone: "emerald" | "rose" | "amber" }) {
  const tones: Record<string, string> = { emerald: "text-emerald-700", rose: "text-rose-600", amber: "text-amber-600" };
  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-3">
      <div className="flex items-center gap-1.5 text-stone-500 mb-1">
        <Icon size={15} />
        <span className="text-xs">{label}</span>
      </div>
      <div className={"text-lg font-bold " + tones[tone]}>{value}</div>
    </div>
  );
}

function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 mb-4">
      {title && <h2 className="font-semibold text-stone-700 mb-3">{title}</h2>}
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-stone-400 text-center py-4">{text}</p>;
}

function Dash({ calc, data }: { calc: Calc; data: TripState }) {
  const cats = Object.entries(calc.byCat).sort((a, b) => b[1] - a[1]);
  const max = cats.length ? cats[0][1] : 1;
  const recent = data.expenses.slice(0, 5);
  return (
    <>
      <Card title="খরচের ভাগ (ক্যাটাগরি)">
        {cats.length === 0 ? (
          <Empty text="এখনো কোনো খরচ যোগ হয়নি" />
        ) : (
          <div className="space-y-2">
            {cats.map(([c, v]) => (
              <div key={c}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-stone-600">{c}</span>
                  <span className="font-medium">{fmt(v)}</span>
                </div>
                <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: (v / max) * 100 + "%" }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
      <Card title="সাম্প্রতিক খরচ">
        {recent.length === 0 ? (
          <Empty text="কিছু নেই" />
        ) : (
          <ul className="divide-y divide-stone-100">
            {recent.map((e) => (
              <li key={e.id} className="flex justify-between items-center py-2 text-sm">
                <div>
                  <span className="text-stone-700">{e.desc || "খরচ"}</span>
                  {e.category && <span className="ml-2 text-xs bg-stone-100 text-stone-500 rounded-full px-2 py-0.5">{e.category}</span>}
                </div>
                <span className="font-medium text-rose-600">{fmt(e.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

interface GiveProps {
  canEdit: boolean;
  members: Member[];
  contributions: Contribution[];
  nameOf: (id: string | null) => string;
  balances: Balance[];
  onAddMember: (name: string) => void;
  onDelMember: (m: Member) => void;
  onAdd: (c: Omit<Contribution, "id">) => void;
  onDel: (c: Contribution) => void;
}

function Give({ canEdit, members, contributions, nameOf, balances, onAddMember, onDelMember, onAdd, onDel }: GiveProps) {
  const [name, setName] = useState("");
  const [mid, setMid] = useState("");
  const [amt, setAmt] = useState("");
  const [note, setNote] = useState("");

  const submitMember = () => {
    if (name.trim()) {
      onAddMember(name.trim());
      setName("");
    }
  };
  const submit = () => {
    const a = parseFloat(amt);
    if (!mid || !a || a <= 0) return;
    onAdd({ memberId: mid, amount: a, note: note.trim() });
    setAmt("");
    setNote("");
  };

  return (
    <>
      <Card title="সদস্য">
        {canEdit && (
          <div className="flex gap-2 mb-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitMember()}
              placeholder="নাম লিখুন"
              className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
            />
            <button onClick={submitMember} className="bg-emerald-700 text-white rounded-lg px-3 py-2 text-sm flex items-center gap-1">
              <Plus size={16} /> যোগ
            </button>
          </div>
        )}
        {members.length === 0 ? (
          <Empty text="কোনো সদস্য নেই" />
        ) : (
          <ul className="divide-y divide-stone-100 rounded-xl border border-stone-200 overflow-hidden">
            {balances.map((m) => (
              <li key={m.id} className="flex items-center gap-3 px-3 py-2.5 bg-white hover:bg-stone-50 transition-colors">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-sm font-semibold">
                  {m.name.trim().slice(0, 1) || "?"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-stone-800 truncate">{m.name}</p>
                  <p className="text-xs text-stone-400">জমা দিয়েছে</p>
                </div>
                <span className="text-emerald-700 font-semibold text-sm tabular-nums">{fmt(m.given)}</span>
                {canEdit && (
                  <button
                    onClick={() => onDelMember(m)}
                    className="text-stone-300 hover:text-rose-500 transition-colors shrink-0"
                    title="মুছুন"
                  >
                    <X size={16} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {canEdit && (
        <Card title="জমা যোগ করুন">
          {members.length === 0 ? (
            <Empty text="আগে উপরে সদস্য যোগ করুন" />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <select
                  value={mid}
                  onChange={(e) => setMid(e.target.value)}
                  className="rounded-lg border border-stone-300 px-3 py-2 text-sm bg-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">কে দিল?</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <input
                  value={amt}
                  onChange={(e) => setAmt(e.target.value)}
                  type="number"
                  placeholder="টাকা"
                  className="rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex gap-2">
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  placeholder="নোট (অপশনাল)"
                  className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                />
                <button onClick={submit} className="bg-emerald-700 text-white rounded-lg px-4 py-2 text-sm">
                  যোগ
                </button>
              </div>
            </>
          )}
        </Card>
      )}

      <Card title="জমার তালিকা">
        {contributions.length === 0 ? (
          <Empty text="এখনো কোনো জমা নেই" />
        ) : (
          <ul className="divide-y divide-stone-100">
            {contributions.map((c) => (
              <li key={c.id} className="flex justify-between items-center py-2 text-sm">
                <div>
                  <span className="text-stone-700">{nameOf(c.memberId)}</span>
                  {c.note && <span className="ml-2 text-xs text-stone-400">{c.note}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium text-emerald-700">{fmt(c.amount)}</span>
                  {canEdit && (
                    <button onClick={() => onDel(c)} className="text-stone-300 hover:text-rose-500">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

interface SpendProps {
  canEdit: boolean;
  members: Member[];
  expenses: Expense[];
  nameOf: (id: string | null) => string;
  onAdd: (e: Omit<Expense, "id" | "ts">) => void;
  onDel: (e: Expense) => void;
}

function Spend({ canEdit, members, expenses, nameOf, onAdd, onDel }: SpendProps) {
  const [amt, setAmt] = useState("");
  const [desc, setDesc] = useState("");
  const [cat, setCat] = useState("");
  const [paidBy, setPaidBy] = useState("");

  const submit = () => {
    const a = parseFloat(amt);
    if (!a || a <= 0) return;
    onAdd({ amount: a, desc: desc.trim(), category: cat || null, paidBy: paidBy || null });
    setAmt("");
    setDesc("");
    setCat("");
    setPaidBy("");
  };

  return (
    <>
      {canEdit && (
        <Card title="খরচ যোগ করুন">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input
              value={amt}
              onChange={(e) => setAmt(e.target.value)}
              type="number"
              placeholder="টাকা *"
              className="rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
            />
            <input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="কী খরচ?"
              className="rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {CATS.map((c) => (
              <button
                key={c}
                onClick={() => setCat(cat === c ? "" : c)}
                className={
                  "text-xs rounded-full px-3 py-1 border transition-colors " +
                  (cat === c
                    ? "bg-emerald-700 text-white border-emerald-700"
                    : "bg-white text-stone-600 border-stone-300 hover:border-emerald-400")
                }
              >
                {c}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <select
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm bg-white focus:outline-none focus:border-emerald-500"
            >
              <option value="">ফান্ড থেকে (অপশনাল: কে দিল)</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} দিয়েছে
                </option>
              ))}
            </select>
            <button onClick={submit} className="bg-emerald-700 text-white rounded-lg px-4 py-2 text-sm">
              যোগ
            </button>
          </div>
        </Card>
      )}

      <Card title="খরচের তালিকা">
        {expenses.length === 0 ? (
          <Empty text="এখনো কোনো খরচ নেই" />
        ) : (
          <ul className="divide-y divide-stone-100">
            {expenses.map((e) => (
              <li key={e.id} className="flex justify-between items-center py-2.5 text-sm">
                <div className="min-w-0">
                  <div className="text-stone-700 truncate">{e.desc || "খরচ"}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {e.category && <span className="text-xs bg-stone-100 text-stone-500 rounded-full px-2 py-0.5">{e.category}</span>}
                    {e.paidBy && <span className="text-xs text-stone-400">{nameOf(e.paidBy)} দিয়েছে</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-medium text-rose-600">{fmt(e.amount)}</span>
                  {canEdit && (
                    <button onClick={() => onDel(e)} className="text-stone-300 hover:text-rose-500">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

function Split({ calc, count }: { calc: Calc; count: number }) {
  if (count === 0)
    return (
      <Card>
        <Empty text="সদস্য ও খরচ যোগ হলে হিসাব দেখা যাবে" />
      </Card>
    );
  return (
    <>
      <Card>
        <div className="flex items-center justify-between text-sm">
          <span className="text-stone-500">জনপ্রতি খরচের ভাগ</span>
          <span className="font-bold text-stone-800">{fmt(calc.share)}</span>
        </div>
        <p className="text-xs text-stone-400 mt-1">
          মোট খরচ {fmt(calc.spent)} ÷ {count} জন
        </p>
      </Card>
      <Card title="কে কত ফেরত পাবে / দিতে হবে">
        <ul className="divide-y divide-stone-100">
          {calc.balances.map((m) => {
            const pos = m.balance >= 0;
            return (
              <li key={m.id} className="py-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-stone-700">{m.name}</span>
                  <span className={"font-semibold " + (pos ? "text-emerald-700" : "text-rose-600")}>
                    {pos ? "ফেরত পাবে " : "দিতে হবে "}
                    {fmt(Math.abs(m.balance))}
                  </span>
                </div>
                <div className="text-xs text-stone-400 mt-0.5">
                  জমা {fmt(m.given)} · ভাগ {fmt(m.share)}
                </div>
              </li>
            );
          })}
        </ul>
        <div className="mt-3 pt-3 border-t border-stone-100 flex justify-between text-sm">
          <span className="text-stone-500">ফান্ডে অবশিষ্ট</span>
          <span className={"font-bold " + (calc.remaining < 0 ? "text-rose-600" : "text-emerald-700")}>{fmt(calc.remaining)}</span>
        </div>
      </Card>
    </>
  );
}
