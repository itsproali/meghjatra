'use client';

import { AlertTriangle } from 'lucide-react';

interface Props {
  open: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ open, title, message, confirmLabel, onConfirm, onCancel }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onCancel}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start gap-3">
          <div className="shrink-0 rounded-full bg-rose-100 p-2 text-rose-600">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-stone-800">{title || 'নিশ্চিত?'}</h3>
            {message && <p className="text-sm text-stone-500 mt-1">{message}</p>}
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onCancel} className="rounded-lg px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100">
            বাতিল
          </button>
          <button onClick={onConfirm} className="rounded-lg px-4 py-2 text-sm font-medium bg-rose-600 text-white hover:bg-rose-700">
            {confirmLabel || 'মুছে ফেলুন'}
          </button>
        </div>
      </div>
    </div>
  );
}
