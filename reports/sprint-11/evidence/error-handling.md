# Sprint 11 Error Handling

## Backend 404 shape
```
HTTP/1.1 404 Not Found
Referrer-Policy: no-referrer
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Cross-Origin-Resource-Policy: same-site
Vary: Origin
Access-Control-Allow-Credentials: true
Content-Type: application/json; charset=utf-8
Content-Length: 149
ETag: W/"95-EDqlMqMkGM2j0EwWM6c8LqNMZBs"
Date: Sat, 07 Mar 2026 10:36:08 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"statusCode":404,"error":"Not Found","message":"Cannot GET /api/v1/not-a-route","timestamp":"2026-03-07T10:36:08.712Z","path":"/api/v1/not-a-route"}
```

## Frontend 404 page
```
HTTP/1.1 404 Not Found
Cache-Control: no-cache, no-store, max-age=0, must-revalidate
X-Powered-By: Next.js
ETag: "ua5djmue9g4ks"
Content-Type: text/html; charset=utf-8
Content-Length: 6026
Vary: Accept-Encoding
Date: Sat, 07 Mar 2026 10:36:08 GMT
Connection: keep-alive
Keep-Alive: timeout=5

<!DOCTYPE html><html dir="rtl" lang="he"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width"/><meta name="next-head-count" content="2"/><link rel="preload" href="/_next/static/media/e4af272ccee01ff0-s.p.woff2" as="font" type="font/woff2" crossorigin="anonymous" data-next-font="size-adjust"/><link rel="preload" href="/_next/static/media/d2e3c073bbb3955e-s.p.woff2" as="font" type="font/woff2" crossorigin="anonymous" data-next-font="size-adjust"/><link rel="preload" href="/_next/static/css/0899da32ea58390f.css" as="style" crossorigin=""/><link rel="stylesheet" href="/_next/static/css/0899da32ea58390f.css" crossorigin="" data-n-g=""/><noscript data-n-css=""></noscript><script defer="" crossorigin="" nomodule="" src="/_next/static/chunks/polyfills-c67a75d1b6f99dc8.js"></script><script src="/_next/static/chunks/webpack-62c53bcedad7929f.js" defer="" crossorigin=""></script><script src="/_next/static/chunks/framework-45b23bd899ce37ec.js" defer="" crossorigin=""></script><script src="/_next/static/chunks/main-7e17183289fda7d1.js" defer="" crossorigin=""></script><script src="/_next/static/chunks/pages/_app-48ef01cbad2737b7.js" defer="" crossorigin=""></script><script src="/_next/static/chunks/pages/404-c62d13f5e219d2d7.js" defer="" crossorigin=""></script><script src="/_next/static/wDDRwmuduaEHRkIycsc7B/_buildManifest.js" defer="" crossorigin=""></script><script src="/_next/static/wDDRwmuduaEHRkIycsc7B/_ssgManifest.js" defer="" crossorigin=""></script></head><body><script>
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
            </script><div id="__next"><div class="__variable_f367f3 __variable_4f62c1 font-sans"><div class="min-h-screen bg-background text-foreground"><main class="flex min-h-screen items-center justify-center bg-background px-6 text-foreground"><div class="mx-auto max-w-lg text-center"><div class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-triangle-alert h-8 w-8 text-destructive" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg></div><p class="text-sm font-medium uppercase tracking-[0.25em] text-muted-foreground">404</p><h1 class="mt-3 text-3xl font-bold">העמוד לא נמצא</h1><p class="mt-3 text-muted-foreground">ייתכן שהקישור שגוי או שהעמוד הוסר. אפשר לחזור ללוח הראשי או למסך ההתחברות.</p><div class="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><a class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2" href="/home"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-left h-4 w-4" aria-hidden="true"><path d="m12 19-7-7 7-7"></path><path d="M19 12H5"></path></svg>חזרה לאפליקציה</a><a class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2" href="/login">מסך התחברות</a></div></div></main></div><div role="region" aria-label="Notifications (F8)" tabindex="-1" style="pointer-events:none"><ol tabindex="-1" class="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:end-0 sm:top-auto sm:flex-col md:max-w-[420px]"></ol></div><section aria-label="Notifications alt+T" tabindex="-1" aria-live="polite" aria-relevant="additions text" aria-atomic="false"></section><div role="region" aria-label="Notifications (F8)" tabindex="-1" style="pointer-events:none"><ol tabindex="-1" class="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:end-0 sm:top-auto sm:flex-col md:max-w-[420px]"></ol></div></div></div><script id="__NEXT_DATA__" type="application/json" crossorigin="">{"props":{"pageProps":{}},"page":"/404","query":{},"buildId":"wDDRwmuduaEHRkIycsc7B","nextExport":true,"autoExport":true,"isFallback":false,"scriptLoader":[]}</script></body></html>
```

Checks:
- Backend unknown routes return structured JSON with `statusCode`, `error`, `message`, `timestamp`, and `path`.
- Frontend unknown routes render the custom 404 page and keep a user-facing recovery path.
- Network-failure handling remains implemented in apps/frontend/lib/auth.ts, where failed authenticated fetches synthesize a `503 Service Unavailable` response with a clear message.
