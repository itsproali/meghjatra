'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface OwnerContextValue {
  isOwner: boolean;
  ownerKey: string;
  login: (pw: string) => Promise<boolean>;
  logout: () => void;
}

const OwnerCtx = createContext<OwnerContextValue>({
  isOwner: false,
  ownerKey: '',
  login: async () => false,
  logout: () => {},
});

const LS_KEY = 'sajek-owner-key';

async function verify(pw: string): Promise<boolean> {
  try {
    const r = await fetch('/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    });
    const j = (await r.json()) as { ok?: boolean };
    return !!j.ok;
  } catch {
    return false;
  }
}

export function OwnerProvider({ children }: { children: ReactNode }) {
  const [ownerKey, setOwnerKey] = useState('');
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    let saved = '';
    try {
      saved = localStorage.getItem(LS_KEY) || '';
    } catch {
      /* ignore */
    }
    if (!saved) return;
    (async () => {
      if (await verify(saved)) {
        setOwnerKey(saved);
        setIsOwner(true);
      } else {
        try {
          localStorage.removeItem(LS_KEY);
        } catch {
          /* ignore */
        }
      }
    })();
  }, []);

  async function login(pw: string): Promise<boolean> {
    const ok = await verify(pw);
    if (ok) {
      setOwnerKey(pw);
      setIsOwner(true);
      try {
        localStorage.setItem(LS_KEY, pw);
      } catch {
        /* ignore */
      }
    }
    return ok;
  }

  function logout() {
    setOwnerKey('');
    setIsOwner(false);
    try {
      localStorage.removeItem(LS_KEY);
    } catch {
      /* ignore */
    }
  }

  return <OwnerCtx.Provider value={{ isOwner, ownerKey, login, logout }}>{children}</OwnerCtx.Provider>;
}

export const useOwner = () => useContext(OwnerCtx);
