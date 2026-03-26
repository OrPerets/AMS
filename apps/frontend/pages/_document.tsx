// /Users/orperetz/Documents/AMS/apps/frontend/pages/_document.tsx
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html dir="rtl" lang="he">
      <Head>
        <meta name="application-name" content="AMIT PMS" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="AMIT PMS" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#0E4A7B" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </Head>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function getInitialLocale() {
                  const stored = localStorage.getItem('amit-locale');
                  if (stored === 'he' || stored === 'en') return stored;
                  return 'he';
                }

                function getInitialTheme() {
                  const stored = localStorage.getItem('amit-theme');
                  if (stored && stored !== 'system') return stored;

                  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                }

                function getInitialDirection(locale) {
                  const stored = localStorage.getItem('amit-direction');
                  if (stored === 'rtl' || stored === 'ltr') return stored;
                  return locale === 'en' ? 'ltr' : 'rtl';
                }

                try {
                  const locale = getInitialLocale();
                  const theme = getInitialTheme();
                  const direction = getInitialDirection(locale);

                  document.documentElement.className = theme;
                  document.documentElement.setAttribute('dir', direction);
                  document.documentElement.lang = locale;
                } catch (e) {
                  // Fallback to defaults
                  document.documentElement.className = 'light';
                  document.documentElement.setAttribute('dir', 'rtl');
                  document.documentElement.lang = 'he';
                }
              })();
            `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window === 'undefined') {
                  return;
                }

                window.__amitDeferredInstallPrompt = window.__amitDeferredInstallPrompt || null;

                window.addEventListener('beforeinstallprompt', function(event) {
                  event.preventDefault();
                  window.__amitDeferredInstallPrompt = event;
                  window.dispatchEvent(new Event('amit:beforeinstallprompt'));
                });

                window.addEventListener('appinstalled', function() {
                  window.__amitDeferredInstallPrompt = null;
                  window.dispatchEvent(new Event('amit:appinstalled'));
                });

                if (!('serviceWorker' in navigator)) {
                  return;
                }

                window.addEventListener('load', function() {
                  var isDevHost =
                    window.location.hostname === 'localhost' ||
                    window.location.hostname === '127.0.0.1';

                  if (isDevHost) {
                    navigator.serviceWorker.getRegistrations().then(function(registrations) {
                      registrations.forEach(function(registration) {
                        registration.unregister();
                      });
                    });
                    return;
                  }

                  navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(function() {
                    // PWA support is progressive enhancement.
                  });
                });
              })();
            `,
          }}
        />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
