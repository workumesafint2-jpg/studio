import type {Metadata, Viewport} from 'next';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'ITB - Innovation and Technology Bureau',
  description: 'Official Process Modeling and Standardization Portal for the Innovation and Technology Bureau.',
  metadataBase: new URL('https://worku-mesafint.vercel.app'),
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ITB Portal',
  },
};

export const viewport: Viewport = {
  themeColor: '#1e3a8a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap" rel="stylesheet" />
        <Script id="error-resilience" strategy="beforeInteractive">
          {`
            window.addEventListener('error', (e) => {
              if (e.message === 'ResizeObserver loop limit exceeded' || e.message === 'Script error.') {
                e.stopImmediatePropagation();
              }
            });
          `}
        </Script>
      </head>
      <body className="font-sans antialiased bg-slate-50 text-slate-900">
        <FirebaseClientProvider>
          {children}
          <SpeedInsights />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}