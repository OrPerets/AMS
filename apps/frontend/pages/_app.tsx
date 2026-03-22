// /Users/orperetz/Documents/AMS/apps/frontend/pages/_app.tsx
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { Fraunces, Heebo, Inter } from 'next/font/google';
import '../styles/globals.css';
import '../styles/gardens.css';
import '../styles/premium-theme.css';
import 'react-day-picker/dist/style.css';
import Layout from '../components/Layout';
import { AppProviders } from '../lib/providers';
import { cn } from '../lib/utils';
import { Toaster as SonnerToaster } from 'sonner';
import { PwaInstallPrompt } from '../components/pwa/PwaInstallPrompt';
import { BottomSurfaceProvider } from '../lib/bottom-surface';

// Font configuration
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const heebo = Heebo({
  subsets: ['hebrew'],
  variable: '--font-heebo',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
});

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <div className={cn(inter.variable, heebo.variable, fraunces.variable, "font-sans")}>
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
      </Head>
      <AppProviders>
        <BottomSurfaceProvider>
          <Layout>
            <Component {...pageProps} />
          </Layout>
          <PwaInstallPrompt />
          <SonnerToaster position="top-center" richColors />
        </BottomSurfaceProvider>
      </AppProviders>
    </div>
  );
}
