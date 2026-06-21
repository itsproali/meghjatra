import './globals.css';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import Nav from '../components/Nav';
import { OwnerProvider } from '../components/OwnerProvider';
import { BRAND } from '../lib/site';

export const metadata: Metadata = {
  title: BRAND.title,
  description: BRAND.description,
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
      </body>
    </html>
  );
}
