// /Users/orperetz/Documents/AMS/apps/frontend/pages/_app.tsx
import type { AppProps } from 'next/app';
import { Inter, Heebo } from 'next/font/google';
import '../styles/globals.css';
import Layout from '../components/Layout';
import { AppProviders } from '../lib/providers';
import { cn } from '../lib/utils';

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

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <div className={cn(inter.variable, heebo.variable, "font-sans")}>
      <AppProviders>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </AppProviders>
    </div>
  );
}
