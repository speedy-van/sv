# SSL/TLS Configuration Fix Guide

## 🔒 Problem: TLS Handshake Failure on iOS/Safari

### Symptoms:
- ❌ iOS TestFlight login fails with "Network Error"
- ❌ SSL Labs shows: `CRL ERROR: IOException occurred`
- ❌ Missing HSTS configuration
- ❌ Safari cannot complete TLS handshake

---

## ✅ Solutions Applied in Code:

### 1. **Next.js Security Headers** (apps/web/next.config.mjs)
```javascript
// HSTS enabled with 2-year max-age
'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload'
```

### 2. **Middleware Force HTTPS** (apps/web/src/middleware.ts)
- Automatically redirects HTTP → HTTPS in production
- Adds security headers to all responses

---

## 🔧 Server-Side SSL Configuration Required:

### **If using Vercel/Netlify:**
✅ SSL is managed automatically - just redeploy:
```bash
cd apps/web
vercel --prod
```

### **If using custom server (Nginx/Apache):**

#### **A. Nginx Configuration:**

Edit `/etc/nginx/sites-available/speedy-van.co.uk`:

```nginx
server {
    listen 443 ssl http2;
    server_name api.speedy-van.co.uk speedy-van.co.uk;

    # SSL Certificate with FULL chain (including intermediates)
    ssl_certificate /etc/letsencrypt/live/speedy-van.co.uk/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/speedy-van.co.uk/privkey.pem;

    # Modern SSL Configuration (iOS 12.1+, Safari 11+)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;

    # OCSP Stapling (FIX for CRL ERROR)
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate /etc/letsencrypt/live/speedy-van.co.uk/chain.pem;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;

    # HSTS Header (2 years)
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    # Additional Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # SSL Session Configuration
    ssl_session_cache shared:SSL:50m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;

    # Proxy to Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Force HTTP → HTTPS redirect
server {
    listen 80;
    server_name api.speedy-van.co.uk speedy-van.co.uk;
    return 301 https://$server_name$request_uri;
}
```

**Apply changes:**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

#### **B. Apache Configuration:**

Edit `/etc/apache2/sites-available/speedy-van.co.uk-ssl.conf`:

```apache
<VirtualHost *:443>
    ServerName api.speedy-van.co.uk
    ServerAlias speedy-van.co.uk

    # SSL Certificate with FULL chain
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/speedy-van.co.uk/cert.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/speedy-van.co.uk/privkey.pem
    SSLCertificateChainFile /etc/letsencrypt/live/speedy-van.co.uk/chain.pem

    # Modern SSL Protocols (iOS 12.1+)
    SSLProtocol -all +TLSv1.2 +TLSv1.3
    SSLCipherSuite HIGH:!aNULL:!MD5
    SSLHonorCipherOrder off

    # Enable OCSP Stapling (FIX for CRL ERROR)
    SSLUseStapling On
    SSLStaplingCache "shmcb:logs/ssl_stapling(32768)"

    # HSTS Header
    Header always set Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"

    # Proxy to Next.js
    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
</VirtualHost>

# Force HTTP → HTTPS
<VirtualHost *:80>
    ServerName api.speedy-van.co.uk
    ServerAlias speedy-van.co.uk
    Redirect permanent / https://speedy-van.co.uk/
</VirtualHost>
```

**Enable modules & apply:**
```bash
sudo a2enmod ssl headers proxy proxy_http
sudo apache2ctl configtest
sudo systemctl reload apache2
```

---

#### **C. Renew/Fix SSL Certificate:**

If using Let's Encrypt:

```bash
# Renew certificate with full chain
sudo certbot renew --force-renewal

# Or get new certificate
sudo certbot certonly --nginx -d speedy-van.co.uk -d api.speedy-van.co.uk
```

**Verify certificate includes intermediates:**
```bash
openssl s_client -connect api.speedy-van.co.uk:443 -showcerts
# Should show: Certificate chain (at least 2 certificates)
```

---

## 🧪 Testing:

### 1. **Test SSL Configuration:**
```bash
# Check OCSP Stapling
echo | openssl s_client -connect api.speedy-van.co.uk:443 -status 2>&1 | grep -A 1 "OCSP Response Status"

# Check certificate chain
echo | openssl s_client -connect api.speedy-van.co.uk:443 -showcerts 2>&1 | grep "Certificate chain"

# Test TLS handshake
curl -vI https://api.speedy-van.co.uk
```

### 2. **Online SSL Test:**
- https://www.ssllabs.com/ssltest/analyze.html?d=api.speedy-van.co.uk
- Should show: **A+ rating** with no CRL errors

### 3. **Test from iOS Device:**
```bash
# Install TestFlight build 51
# Try logging in - should work without "Network Error"
```

---

## 📋 Checklist:

- [ ] SSL certificate includes **intermediate certificates** (fullchain.pem)
- [ ] **OCSP Stapling** enabled in Nginx/Apache
- [ ] **HSTS header** enabled (max-age=63072000)
- [ ] TLS 1.2+ protocols enabled
- [ ] HTTP automatically redirects to HTTPS
- [ ] SSL Labs test shows **A+ rating** (no CRL errors)
- [ ] TestFlight login works on iPhone

---

## 🚀 Deployment:

After fixing server configuration:

```bash
# 1. Test Next.js build locally
cd apps/web
pnpm build

# 2. Restart Next.js server
pm2 restart speedy-van-web

# 3. Test from iPhone TestFlight
# Login should work immediately
```

---

## 📞 Support:

If you're using a managed hosting provider (Vercel/Netlify):
- Just redeploy - SSL is automatic
- HSTS headers are already added in code

If you're using a custom VPS/server:
- Apply Nginx/Apache configuration above
- Ensure Let's Encrypt certificate has full chain
- Enable OCSP stapling

