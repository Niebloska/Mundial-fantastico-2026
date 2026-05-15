import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Eurocopa Fantástica 2024',
  description: 'Tu fantasy de fútbol',
  manifest: '/manifest.json',
  icons: {
    apple: '/icon-512x512.png',
  },
  openGraph: {
    images: [
      {
        url: '/icon-512x512.png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [
      {
        url: '/icon-512x512.png',
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: '#22c55e',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
