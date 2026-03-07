# Sprint 11 Security Checklist

## Security headers

Response headers from GET /health:

```
HTTP/1.1 200 OK
Referrer-Policy: no-referrer
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Cross-Origin-Resource-Policy: same-site
Vary: Origin
Access-Control-Allow-Credentials: true
Content-Type: application/json; charset=utf-8
Content-Length: 15
ETag: W/"f-VaSQ4oDUiZblZNAEkkN+sX+q3Sg"
Date: Sat, 07 Mar 2026 10:36:08 GMT
Connection: keep-alive
Keep-Alive: timeout=5

```

Checks:
- `X-Powered-By` is absent.
- `X-Content-Type-Options: nosniff` is present.
- `X-Frame-Options: DENY` is present.
- `Referrer-Policy: no-referrer` is present.

## Authentication and authorization

### Unauthenticated protected route
```
HTTP/1.1 401 Unauthorized
Referrer-Policy: no-referrer
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Cross-Origin-Resource-Policy: same-site
Vary: Origin
Access-Control-Allow-Credentials: true
Content-Type: application/json; charset=utf-8
Content-Length: 132
ETag: W/"84-TQwYryBOAn3aRHfGweM+7vnfco8"
Date: Sat, 07 Mar 2026 10:36:08 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"statusCode":401,"error":"Unauthorized","message":"Unauthorized","timestamp":"2026-03-07T10:36:08.542Z","path":"/api/v1/dashboard"}
```

### PM role attempting admin-only route
```
HTTP/1.1 403 Forbidden
Referrer-Policy: no-referrer
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Cross-Origin-Resource-Policy: same-site
Vary: Origin
Access-Control-Allow-Credentials: true
Content-Type: application/json; charset=utf-8
Content-Length: 124
ETag: W/"7c-wAHapFwtEqoKLsfxssBOkhvdrPE"
Date: Sat, 07 Mar 2026 10:36:08 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"statusCode":403,"error":"Forbidden","message":"Forbidden resource","timestamp":"2026-03-07T10:36:08.667Z","path":"/users"}
```

## Validation and token behavior

### Extra request field rejected by global validation pipe
```
HTTP/1.1 400 Bad Request
Referrer-Policy: no-referrer
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Cross-Origin-Resource-Policy: same-site
Vary: Origin
Access-Control-Allow-Credentials: true
Content-Type: application/json; charset=utf-8
Content-Length: 151
ETag: W/"97-scbzCL2HB8mZcawQRSvvAUeMUFM"
Date: Sat, 07 Mar 2026 10:36:08 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"statusCode":400,"error":"Bad Request","message":["property unexpected should not exist"],"timestamp":"2026-03-07T10:36:08.678Z","path":"/auth/login"}
```

### Token expiry durations from freshly issued JWTs
```
access_exp_seconds=900
refresh_exp_seconds=604800
```

Expected:
- Access token TTL is 900 seconds (15 minutes).
- Refresh token TTL is 604800 seconds (7 days).

## File upload restrictions

### Unsupported upload rejected
```
HTTP/1.1 400 Bad Request
Referrer-Policy: no-referrer
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Cross-Origin-Resource-Policy: same-site
Vary: Origin
Access-Control-Allow-Credentials: true
Content-Type: application/json; charset=utf-8
Content-Length: 152
ETag: W/"98-dvtJJZFsGiJ8YBN5txPYa4H2iU4"
Date: Sat, 07 Mar 2026 10:36:08 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"statusCode":400,"error":"Bad Request","message":"Unsupported document type.","timestamp":"2026-03-07T10:36:08.700Z","path":"/api/v1/documents/upload"}
```

## XSS/unsafe HTML review

Search command:
```
rg -n "dangerouslySetInnerHTML" apps/frontend
```

Result:
```
apps/frontend/pages/_document.tsx:10:          dangerouslySetInnerHTML={{
```

Interpretation:
- The only match is the controlled bootstrap snippet in `pages/_document.tsx` for theme/direction hydration.
- No application content is rendered through `dangerouslySetInnerHTML` on the reviewed route surface.
