// /Users/orperetz/Documents/AMS/apps/frontend/pages/_document.tsx
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html dir="rtl" lang="he">
      <Head />
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function getInitialTheme() {
                  const stored = localStorage.getItem('amit-theme');
                  if (stored && stored !== 'system') return stored;
                  
                  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                }
                
                function getInitialDirection() {
                  const stored = localStorage.getItem('amit-direction');
                  return stored || 'rtl';
                }
                
                try {
                  const theme = getInitialTheme();
                  const direction = getInitialDirection();
                  
                  document.documentElement.className = theme;
                  document.documentElement.setAttribute('dir', direction);
                  document.documentElement.lang = direction === 'rtl' ? 'he' : 'en';
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
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
