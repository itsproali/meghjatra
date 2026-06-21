'use client';

import { useState, useEffect, useCallback } from 'react';
import { Upload, Download, Trash2, Loader2, ImagePlus, X, ChevronLeft, ChevronRight, Folder } from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';
import { useOwner } from './OwnerProvider';
import type { Photo } from '../lib/types';
import { toBn } from '../lib/site';

export default function Gallery() {
  const { isOwner, ownerKey } = useOwner();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [caption, setCaption] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [err, setErr] = useState('');
  const [drag, setDrag] = useState(false);
  const [confirm, setConfirm] = useState<Photo | null>(null);
  const [lightbox, setLightbox] = useState<number | null>(null);
  // folder state: selected for upload, new-folder mode, and the active view filter
  const [folder, setFolder] = useState('');
  const [newFolderMode, setNewFolderMode] = useState(false);
  const [newFolder, setNewFolder] = useState('');
  const [activeFolder, setActiveFolder] = useState<string | null>(null);

  const UNCAT = '__uncat__';
  const MAX_FOLDERS = 15;
  const realFolders = Array.from(
    new Set(photos.map((p) => p.folder).filter(Boolean) as string[])
  ).sort((a, b) => a.localeCompare(b, 'bn'));
  const atFolderLimit = realFolders.length >= MAX_FOLDERS;
  const hasUncat = photos.some((p) => !p.folder);
  const shown =
    activeFolder === null
      ? photos
      : activeFolder === UNCAT
        ? photos.filter((p) => !p.folder)
        : photos.filter((p) => p.folder === activeFolder);

  useEffect(() => {
    try {
      setName(localStorage.getItem('sajek-uploader-name') || '');
    } catch {
      /* ignore */
    }
    load();
  }, []);

  // object URLs for selected files — revoke the old ones when files change
  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  // no albums yet → force new-album mode so an upload must create one
  useEffect(() => {
    if (!loading && realFolders.length === 0) setNewFolderMode(true);
  }, [loading, realFolders.length]);

  async function load() {
    try {
      const r = await fetch('/api/photos', { cache: 'no-store' });
      setPhotos((await r.json()) as Photo[]);
    } catch {
      /* ignore */
    }
    setLoading(false);
  }

  function addFiles(list: FileList | null) {
    if (!list) return;
    const imgs = Array.from(list).filter((f) => f.type.startsWith('image/'));
    if (imgs.length) {
      setErr('');
      setFiles((prev) => [...prev, ...imgs]);
    }
  }
  const removeFile = (idx: number) => setFiles((f) => f.filter((_, i) => i !== idx));

  async function upload() {
    setErr('');
    if (files.length === 0) {
      setErr('অন্তত একটা ছবি বেছে নাও');
      return;
    }
    const folderToSend = (newFolderMode ? newFolder : folder || realFolders[0] || '').trim();
    if (!folderToSend) {
      setErr('একটা অ্যালবাম বেছে নাও বা নতুন বানাও');
      return;
    }
    // block a new album once the limit is reached
    if (!realFolders.includes(folderToSend) && atFolderLimit) {
      setErr(`সর্বোচ্চ ${toBn(MAX_FOLDERS)}টা অ্যালবাম বানানো যাবে`);
      return;
    }
    setBusy(true);
    try {
      localStorage.setItem('sajek-uploader-name', name);
    } catch {
      /* ignore */
    }
    let ok = 0;
    let failMsg = '';
    for (let i = 0; i < files.length; i++) {
      setProgress({ done: i, total: files.length });
      try {
        const fd = new FormData();
        fd.append('image', files[i]);
        fd.append('caption', caption);
        fd.append('uploader', name || 'অজ্ঞাত');
        fd.append('folder', folderToSend);
        const r = await fetch('/api/photos', { method: 'POST', body: fd });
        const j = (await r.json()) as Photo & { error?: string };
        if (!r.ok) throw new Error(j.error || 'failed');
        setPhotos((p) => [j, ...p]);
        ok++;
      } catch (e) {
        const m = e instanceof Error ? e.message : '';
        failMsg = m && m !== 'failed' ? m : 'কিছু ছবি আপলোড হয়নি';
        break; // stop on limit/error
      }
    }
    setProgress(null);
    setBusy(false);
    if (ok > 0) {
      setFiles([]);
      setCaption('');
      // keep the new folder selected so later uploads go there too
      if (folderToSend) {
        setFolder(folderToSend);
        setActiveFolder(folderToSend);
      }
      setNewFolderMode(false);
      setNewFolder('');
    }
    if (failMsg) setErr(ok > 0 ? `${toBn(ok)} টা আপলোড হলো। ${failMsg}` : failMsg);
  }

  async function doDelete(id: string) {
    setPhotos((p) => p.filter((x) => x.id !== id));
    try {
      await fetch('/api/photos/' + id, { method: 'DELETE', headers: { 'x-owner-key': ownerKey } });
    } catch {
      /* ignore */
    }
  }

  async function download(url: string, idx: number) {
    try {
      const r = await fetch(url);
      const b = await r.blob();
      const u = URL.createObjectURL(b);
      const a = document.createElement('a');
      a.href = u;
      a.download = 'sajek-' + (idx + 1) + '.jpg';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(u);
    } catch {
      window.open(url, '_blank');
    }
  }

  // lightbox keyboard navigation
  const move = useCallback(
    (d: number) => setLightbox((cur) => (cur === null ? cur : (cur + d + shown.length) % shown.length)),
    [shown.length]
  );
  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null);
      else if (e.key === 'ArrowRight') move(1);
      else if (e.key === 'ArrowLeft') move(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, move]);

  return (
    <div className="mx-auto max-w-4xl p-4 pb-24">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-emerald-900">ট্রিপের ছবি</h1>
        <p className="text-sm text-stone-500">যে কেউ ছবি শেয়ার করতে পারবে · সবাই দেখতে ও ডাউনলোড করতে পারবে</p>
      </header>

      {/* Upload card */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 mb-5">
        <label
          htmlFor="photo-input"
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            addFiles(e.dataTransfer.files);
          }}
          className={
            'flex flex-col items-center justify-center gap-1.5 border-2 border-dashed rounded-xl py-7 text-sm cursor-pointer transition-colors ' +
            (drag ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-stone-300 text-stone-500 hover:border-emerald-400 hover:bg-stone-50')
          }
        >
          <ImagePlus size={22} />
          <span className="font-medium">ছবি বেছে নাও বা টেনে আনো</span>
          <span className="text-xs text-stone-400">একসাথে অনেকগুলো দেওয়া যাবে</span>
        </label>
        <input
          id="photo-input"
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />

        {previews.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-stone-500 mb-2">{toBn(previews.length)} টা ছবি নির্বাচিত</p>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {previews.map((src, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-stone-100 group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={'নির্বাচিত ' + (i + 1)} className="w-full h-full object-cover" />
                  {!busy && (
                    <button
                      onClick={() => removeFile(i)}
                      className="absolute top-0.5 right-0.5 bg-black/55 text-white rounded-full p-0.5 hover:bg-rose-600"
                      title="বাদ দাও"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Album select */}
        <div className="mt-3">
          <label className="text-xs text-stone-500 mb-1 flex items-center gap-1">
            <Folder size={13} /> কোন অ্যালবামে রাখবে?
          </label>
          {newFolderMode ? (
            <div className="flex gap-2">
              <input
                value={newFolder}
                onChange={(e) => setNewFolder(e.target.value)}
                autoFocus
                maxLength={60}
                placeholder="নতুন অ্যালবামের নাম"
                className="flex-1 rounded-xl border border-stone-300 px-3 py-2 text-sm transition-colors focus:outline-none focus:border-emerald-500"
              />
              {realFolders.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setNewFolderMode(false);
                    setNewFolder('');
                  }}
                  className="rounded-xl border border-stone-300 px-3 text-sm text-stone-500 hover:bg-stone-50"
                >
                  বাতিল
                </button>
              )}
            </div>
          ) : (
            <select
              value={folder || realFolders[0] || ''}
              onChange={(e) => {
                if (e.target.value === '__new__') setNewFolderMode(true);
                else setFolder(e.target.value);
              }}
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm bg-white transition-colors focus:outline-none focus:border-emerald-500"
            >
              {realFolders.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
              {!atFolderLimit && <option value="__new__">+ নতুন অ্যালবাম</option>}
            </select>
          )}
          <p className="text-[11px] text-stone-400 mt-1">
            {toBn(realFolders.length)}/{toBn(MAX_FOLDERS)} অ্যালবাম
            {atFolderLimit && ' · লিমিট পূর্ণ'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="তোমার নাম"
            className="rounded-xl border border-stone-300 px-3 py-2 text-sm transition-colors focus:outline-none focus:border-emerald-500"
          />
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="ক্যাপশন (অপশনাল)"
            className="rounded-xl border border-stone-300 px-3 py-2 text-sm transition-colors focus:outline-none focus:border-emerald-500"
          />
        </div>
        {err && <p className="text-sm text-rose-600 mt-2">{err}</p>}
        <button
          onClick={upload}
          disabled={busy}
          className="mt-3 w-full flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl py-2.5 text-sm font-medium shadow-sm transition-colors active:scale-[0.99] disabled:opacity-60"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          {busy && progress
            ? `আপলোড হচ্ছে… ${toBn(progress.done + 1)}/${toBn(progress.total)}`
            : files.length > 1
              ? `${toBn(files.length)} টা ছবি শেয়ার করো`
              : 'শেয়ার করো'}
        </button>
      </div>

      {/* Album filter */}
      {(realFolders.length > 0 || hasUncat) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { key: null as string | null, label: 'সব' },
            ...realFolders.map((f) => ({ key: f as string | null, label: f })),
            ...(hasUncat ? [{ key: UNCAT as string | null, label: 'অন্যান্য' }] : []),
          ].map((c) => (
            <button
              key={c.key ?? '__all__'}
              onClick={() => {
                setActiveFolder(c.key);
                setLightbox(null);
              }}
              className={
                'flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ' +
                (activeFolder === c.key
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-white border border-stone-200 text-stone-600 hover:border-emerald-400')
              }
            >
              {c.key !== null && <Folder size={13} />}
              {c.label}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 text-stone-400 py-16">
          <Loader2 size={18} className="animate-spin" /> লোড হচ্ছে…
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center py-14 text-stone-400">
          <ImagePlus size={32} className="mx-auto mb-2 opacity-60" />
          <p className="text-sm">এখনো কোনো ছবি শেয়ার হয়নি — প্রথমটা তুমিই দাও!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {shown.map((p, i) => (
            <div key={p.id} className="group relative aspect-square rounded-2xl overflow-hidden bg-stone-200 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt={p.caption || 'ছবি'}
                loading="lazy"
                onClick={() => setLightbox(i)}
                className="w-full h-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
              />
              {/* actions: always on mobile, on hover for desktop */}
              <div className="absolute top-2 right-2 flex gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => download(p.url, i)}
                  className="bg-white/90 backdrop-blur text-stone-700 hover:text-emerald-700 rounded-full p-1.5 shadow-sm"
                  title="ডাউনলোড"
                >
                  <Download size={15} />
                </button>
                {isOwner && (
                  <button
                    onClick={() => setConfirm(p)}
                    className="bg-white/90 backdrop-blur text-stone-700 hover:text-rose-600 rounded-full p-1.5 shadow-sm"
                    title="মুছুন"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
              {(p.caption || p.uploader) && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent p-2.5 pt-7 pointer-events-none">
                  {p.caption && (
                    <p className="text-[15px] leading-snug text-white font-semibold truncate drop-shadow-sm">{p.caption}</p>
                  )}
                  {p.uploader && <p className="text-[11px] text-white/65 truncate">{p.uploader}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox !== null && shown[lightbox] && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col" onClick={() => setLightbox(null)}>
          <div className="flex items-center justify-between p-4 text-white/90">
            <span className="text-sm">{toBn(lightbox + 1)} / {toBn(shown.length)}</span>
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  download(shown[lightbox].url, lightbox);
                }}
                className="rounded-full p-2 hover:bg-white/10"
                title="ডাউনলোড"
              >
                <Download size={20} />
              </button>
              <button onClick={() => setLightbox(null)} className="rounded-full p-2 hover:bg-white/10" title="বন্ধ">
                <X size={20} />
              </button>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center px-2 min-h-0" onClick={() => setLightbox(null)}>
            {shown.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  move(-1);
                }}
                className="shrink-0 text-white/80 hover:text-white p-2"
                title="আগের"
              >
                <ChevronLeft size={30} />
              </button>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={shown[lightbox].url}
              alt={shown[lightbox].caption || 'ছবি'}
              onClick={(e) => e.stopPropagation()}
              className="max-h-full max-w-full object-contain rounded-lg"
            />
            {shown.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  move(1);
                }}
                className="shrink-0 text-white/80 hover:text-white p-2"
                title="পরের"
              >
                <ChevronRight size={30} />
              </button>
            )}
          </div>
          {(shown[lightbox].caption || shown[lightbox].uploader) && (
            <div className="p-4 text-center">
              {shown[lightbox].caption && (
                <p className="text-white font-semibold text-base">{shown[lightbox].caption}</p>
              )}
              {shown[lightbox].uploader && (
                <p className="text-white/60 text-xs mt-0.5">{shown[lightbox].uploader}</p>
              )}
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        title="ছবি মুছবেন?"
        message="এই ছবিটা সবার জন্য মুছে যাবে।"
        onConfirm={() => {
          if (confirm) doDelete(confirm.id);
          setConfirm(null);
        }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
