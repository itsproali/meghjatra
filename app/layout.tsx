import './globals.css';
import type { Metadata, Viewport } from 'next';
import { ReactNode } from 'react';
import Nav from '../components/Nav';
import { OwnerProvider } from '../components/OwnerProvider';
import PwaRegister from '../components/PwaRegister';
import { BRAND } from '../lib/site';

export const metadata: Metadata = {
  title: BRAND.title,
  description: BRAND.description,
  applicationName: BRAND.name,
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: BRAND.name },
};

export const viewport: Viewport = {
  themeColor: '#064e3b',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="bn">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-gradient-to-b from-stone-50 to-stone-100 text-stone-800 min-h-screen antialiased">
        <OwnerProvider>
          <Nav />
          <main>{children}</main>
        </OwnerProvider>
        <PwaRegister />
      </body>
    </html>
  );
}
