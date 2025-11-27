# Testing Cookie Authentication Fix

## Pre-Test Checklist

### 1. Restart Development Server

```powershell
# Stop current dev server (Ctrl+C)
cd C:\sv\apps\web
pnpm dev
```

### 2. Clear Browser State

**Option A: Use Incognito/Private Mode** (Recommended)
- Chrome: `Ctrl+Shift+N`
- Edge: `Ctrl+Shift+P`
- Firefox: `Ctrl+Shift+P`

**Option B: Clear Cookies Manually**
1. Open DevTools (F12)
2. Application → Cookies → `http://localhost:3000`
3. Delete all cookies

### 3. Check Browser Privacy Settings

**Microsoft Edge:**
```
Settings → Privacy, search, and services
→ Tracking prevention: Set to "Basic" or "Balanced"
```

**Chrome:**
```
Settings → Privacy and security
→ Cookies and other site data
→ Ensure "Allow all cookies" is enabled (for testing)
```

---

## Test Scenarios

### ✅ Test 1: Basic Login Flow

#### Steps:
1. Open `http://localhost:3000/auth/login`
2. Open DevTools Console (F12)
3. Enter admin credentials
4. Click "Login"

#### Expected Console Output:
```
🔐 Login attempt: admin@example.com
🔐 Login endpoint called
✅ Login successful: admin@example.com
🍪 Cookie set successfully: {
  tokenPreview: 'eyJhbGciOiJIUzI1NiJ9...',
  environment: 'development',
  cookieSettings: {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 2592000,
    path: '/'
  }
}
✅ Login successful, data: {...}
🍪 Auth cookie set by server
```

#### ❌ If Failed:
- Check for "Tracking Prevention blocked" warning
- Verify `secure: false` in cookie settings
- Check Network tab for API response

---

### ✅ Test 2: Cookie Verification

#### Steps:
1. After successful login, stay on login page
2. Open DevTools → Application → Cookies
3. Select `http://localhost:3000`

#### Expected Cookie:

| Property | Expected Value |
|----------|---------------|
| Name | `auth-token` |
| Value | `eyJhbGci...` (long string) |
| Domain | `localhost` |
| Path | `/` |
| Expires | (30 days from now) |
| HttpOnly | ✓ (checked) |
| Secure | (empty/unchecked in dev) |
| SameSite | `Lax` |

#### ❌ If Cookie Not Found:
```
Possible causes:
1. Login API failed (check Console for errors)
2. Browser blocked cookie (check Privacy settings)
3. JavaScript error (check Console)
```

---

### ✅ Test 3: Admin Page Access

#### Steps:
1. After login, navigate to `http://localhost:3000/admin`
2. Observe Console output

#### Expected Console Output:
```
🔍 getCustomSession - Cookie check: {
  hasToken: true,
  tokenLength: 200+,
  totalCookies: 1,
  cookieNames: ['auth-token'],
  authTokenCookie: {
    name: 'auth-token',
    valueLength: 200+,
    valuePreview: 'eyJhbGciOiJIUzI1NiJ9...'
  }
}
✅ getCustomSession - Token verified successfully for: admin@example.com
🔐 Admin Layout - Session check: {
  hasSession: true,
  userRole: 'admin',
  email: 'admin@example.com'
}
✅ Admin Layout - Access granted for admin user
```

#### ✅ Success:
- Admin dashboard loads
- No redirect to login
- User menu shows correct name

#### ❌ If Failed:
```
Console shows:
🔍 getCustomSession - Cookie check: {
  hasToken: false,
  totalCookies: 0,
  cookieNames: []
}
❌ getCustomSession - No auth-token cookie found (no token present)
⚠️  This usually means:
   1. Browser did not send the cookie (check SameSite/Secure/Domain)
   2. Cookie was blocked by browser privacy settings
   3. Cookie expired or was deleted
   4. Different domain/port between login and current request
```

**Action:**
- Check Network tab → Request Headers → Should contain `Cookie: auth-token=...`
- If missing, browser is not sending cookie

---

### ✅ Test 4: Cookie Persistence After Refresh

#### Steps:
1. On `/admin` page
2. Press `F5` or `Ctrl+R` to refresh

#### Expected:
- Page reloads without redirect to login
- Admin content displays immediately
- Cookie still present in Application tab

#### ❌ If Failed:
- Cookie was deleted or expired
- Check cookie `maxAge` setting

---

### ✅ Test 5: Network Request Headers

#### Steps:
1. Navigate to `/admin`
2. Open DevTools → Network tab
3. Click on the `/admin` request
4. Go to **Request Headers** section

#### Expected Headers:
```http
GET /admin HTTP/1.1
Host: localhost:3000
Cookie: auth-token=eyJhbGciOiJIUzI1NiJ9...
User-Agent: Mozilla/5.0...
```

#### Critical:
- `Cookie:` header MUST be present
- Must contain `auth-token=...`

#### ❌ If Cookie Header Missing:
This is the root cause. Browser is not sending cookie because:
1. `SameSite=strict` (should be `lax`)
2. `Secure=true` on HTTP (should be `false` in dev)
3. Domain mismatch
4. Privacy settings blocking

---

### ✅ Test 6: API Session Check

#### Steps:
1. While logged in, open new tab
2. Go to: `http://localhost:3000/api/auth/custom-session`

#### Expected Response:
```json
{
  "user": {
    "id": "...",
    "email": "admin@example.com",
    "name": "Admin User",
    "role": "admin",
    "adminRole": null
  }
}
```

#### ❌ If Failed:
```json
{
  "session": null,
  "user": null
}
```
- API cannot read cookie
- Check DevTools → Network → Request Headers

---

### ✅ Test 7: Logout

#### Steps:
1. Click "Logout" button in admin panel
2. Observe Console

#### Expected:
```
🚪 Logout requested
✅ Auth token cleared
```

#### Verify:
- Cookie deleted from Application tab
- Redirected to login page
- Cannot access `/admin` anymore

---

## Common Issues & Solutions

### Issue 1: "No auth-token cookie found" after successful login

**Diagnosis:**
```powershell
# Check if cookie is set in response
curl -v http://localhost:3000/api/auth/custom-login `
  -H "Content-Type: application/json" `
  -d '{"email":"admin@example.com","password":"yourpassword"}'

# Look for:
# Set-Cookie: auth-token=...; Path=/; HttpOnly; SameSite=Lax
```

**Solutions:**
1. ✅ Ensure `secure: false` in development
2. ✅ Ensure `sameSite: 'lax'`
3. ✅ Clear all cookies and retry
4. ✅ Disable browser tracking prevention

---

### Issue 2: Cookie set but not sent in subsequent requests

**Check:**
1. DevTools → Application → Cookies → Is cookie there?
   - ✅ Yes → Browser blocking (privacy settings)
   - ❌ No → Cookie not persisted (check Response headers)

2. DevTools → Network → Request Headers → Is `Cookie:` header present?
   - ❌ No → SameSite/Secure/Domain issue

**Fix:**
```typescript
// Verify cookie settings in custom-login/route.ts
const cookieOptions = {
  httpOnly: true,
  secure: false, // Must be false in dev!
  sameSite: 'lax', // Not 'strict'!
  maxAge: 60 * 60 * 24 * 30,
  path: '/',
};
```

---

### Issue 3: "Tracking Prevention blocked access to storage"

**Solution:**
```
Edge:
1. Click lock icon in address bar
2. Click "Cookies and site permissions"
3. Allow cookies for localhost

OR

1. Settings → Privacy → Tracking prevention
2. Choose "Basic" or "Balanced"
3. Add localhost to exceptions
```

---

### Issue 4: Works in Chrome but not Edge/Firefox

**Cause:** Different default privacy settings

**Solution:**
- Test in Incognito/Private mode first
- Adjust privacy settings in each browser
- Ensure consistent cookie attributes across browsers

---

## Validation Script

Create a test script to automate checks:

```powershell
# test-auth.ps1
Write-Host "🧪 Testing Authentication Flow..." -ForegroundColor Cyan

# 1. Test login endpoint
Write-Host "`n1️⃣ Testing login endpoint..." -ForegroundColor Yellow
$loginResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/custom-login" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"email":"admin@example.com","password":"admin123"}' `
  -SessionVariable session

if ($loginResponse.StatusCode -eq 200) {
  Write-Host "✅ Login successful" -ForegroundColor Green
  
  # Extract cookie
  $cookie = $session.Cookies.GetCookies("http://localhost:3000") | Where-Object {$_.Name -eq "auth-token"}
  
  if ($cookie) {
    Write-Host "✅ Cookie received:" -ForegroundColor Green
    Write-Host "   Name: $($cookie.Name)"
    Write-Host "   Value: $($cookie.Value.Substring(0,30))..."
    Write-Host "   Expires: $($cookie.Expires)"
    Write-Host "   HttpOnly: $($cookie.HttpOnly)"
    Write-Host "   Secure: $($cookie.Secure)"
    Write-Host "   Path: $($cookie.Path)"
  } else {
    Write-Host "❌ No auth-token cookie in response!" -ForegroundColor Red
  }
} else {
  Write-Host "❌ Login failed: $($loginResponse.StatusCode)" -ForegroundColor Red
  exit 1
}

# 2. Test session endpoint with cookie
Write-Host "`n2️⃣ Testing session endpoint..." -ForegroundColor Yellow
$sessionResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/custom-session" `
  -WebSession $session

$sessionData = $sessionResponse.Content | ConvertFrom-Json

if ($sessionData.user) {
  Write-Host "✅ Session valid:" -ForegroundColor Green
  Write-Host "   Email: $($sessionData.user.email)"
  Write-Host "   Role: $($sessionData.user.role)"
} else {
  Write-Host "❌ Session invalid - cookie not sent!" -ForegroundColor Red
  exit 1
}

Write-Host "`n✅ All tests passed!" -ForegroundColor Green
```

**Run:**
```powershell
.\test-auth.ps1
```

---

## Success Criteria

All of these must be ✅:

- [x] Login API returns 200 with `Set-Cookie` header
- [x] Cookie appears in DevTools → Application → Cookies
- [x] Cookie has correct attributes (HttpOnly, SameSite=Lax, Secure=false in dev)
- [x] Subsequent requests include `Cookie:` header
- [x] `/api/auth/custom-session` returns user data
- [x] `/admin` page loads without redirect
- [x] `getCustomSession()` finds token and verifies it
- [x] Refresh page preserves authentication
- [x] Logout clears cookie and redirects

---

## Next Steps After Fix

1. **Test in Production:**
   - Verify `secure: true` works on HTTPS
   - Test with real domain (not localhost)
   - Verify SameSite behavior across subdomains

2. **Monitor Logs:**
   ```bash
   # Check for authentication errors
   grep "getCustomSession" logs/*.log
   grep "Cookie" logs/*.log
   ```

3. **Consider Enhancements:**
   - Add CSRF protection
   - Implement refresh tokens
   - Add session expiry warnings
   - Log suspicious login attempts

---

## Contact

If issues persist after following this guide:
1. Capture full Network logs (HAR file)
2. Capture Console logs
3. Check `COOKIE_AUTH_FIX_GUIDE.md` for detailed explanations
