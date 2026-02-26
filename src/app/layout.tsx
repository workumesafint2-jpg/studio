
import type {Metadata, Viewport} from 'next';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'ITDB - Innovation and Technology Development Bureau',
  description: 'Official Process Modeling and Standardization Portal for the Innovation and Technology Development Bureau.',
  metadataBase: new URL('https://worku-mesafint.vercel.app'),
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ITDB Portal',
  },
  formatDetection: {
    telephone: false,
  },
  manifest: '/manifest.json',
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
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+Ethiopic:wght@400;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;500&display=swap" rel="stylesheet" />
        <meta name="application-name" content="ITDB Portal" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ITDB Portal" />
        <meta name="mobile-web-app-capable" content="yes" />
        <Script id="error-resilience" strategy="beforeInteractive">
          {`
            window.addEventListener('error', (e) => {
              if (e.message === 'ResizeObserver loop limit exceeded' || e.message === 'Script error.') {
                const resizeObserverErrGuid = 'window.onerror - ResizeObserver loop limit exceeded';
                if (e.message === resizeObserverErrGuid) {
                  e.stopImmediatePropagation();
                }
              }
            });
            window.addEventListener('unhandledrejection', (e) => {
              if (e.reason && (e.reason.message === 'ResizeObserver loop limit exceeded' || e.reason === 'ResizeObserver loop limit exceeded')) {
                e.stopImmediatePropagation();
              }
            });
          `}
        </Script>
      </head>
      <body className="font-body antialiased bg-background text-foreground">
        <FirebaseClientProvider>
          {children}
          <SpeedInsights />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
