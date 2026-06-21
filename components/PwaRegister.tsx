'use client';

import { useEffect } from 'react';

// সার্ভিস ওয়ার্কার রেজিস্টার করে — অ্যাপটা ইনস্টলযোগ্য (PWA) করে তোলে।
export default function PwaRegister() {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    const onLoad = () => navigator.serviceWorker.register('/sw.js').catch(() => {});
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);
  return null;
}
