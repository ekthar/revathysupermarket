# DigitalOcean PM2 Deployment Guide

Complete guide for deploying Revathy Supermarket on a DigitalOcean droplet with PM2, Nginx, and PostgreSQL.

---

## 1. Overview

### Architecture

```
                    Internet
                       |
              [ DigitalOcean Droplet ]
                       |
               +-------+-------+
               |    Nginx      |  (reverse proxy, SSL, static cache)
               +-------+-------+
                       |
               +-------+-------+
               |  PM2 (Node)   |  (process manager, auto-restart)
               |  Next.js :3000|
               +-------+-------+
                       |
          +------------+------------+
          |                         |
  +-------+-------+     +----------+---------+
  | PostgreSQL 16 |     | Upstash Redis      |
  | (local)       |     | (HTTP REST, cloud) |
  +---------+-----+     +--------------------+
```

### Components

| Component     | Role                             |
|---------------|----------------------------------|
| Nginx         | Reverse proxy, SSL termination   |
| PM2           | Process manager, auto-restart    |
| Next.js       | Application server (port 3000)   |
| PostgreSQL 16 | Primary database (local)         |
| Upstash Redis | Rate limiting, caching (cloud)   |
| Let's Encrypt | Free SSL certificates            |

### Estimated Costs

| Resource          | Monthly Cost |
|-------------------|--------------|
| Droplet (2GB/1CPU)| ~$12         |
| Upstash Redis     | Free tier    |
| Domain            | ~$10/year    |
| **Total**         | **~$13/mo**  |

> **Important:** This app uses `@upstash/redis` (HTTP REST API), NOT a local Redis server. You do NOT need to install or run Redis on the droplet.

---

## 2. Prerequisites

- **DigitalOcean account** with a 2GB RAM / 1 vCPU droplet (minimum)
- **Ubuntu 24.04 LTS** image
- **Domain name** pointed to the droplet IP
- **Upstash account** for Redis (free tier works): https://upstash.com
- **GitHub repository access** for cloning
- SSH key pair for server access

---

## 3. Server Setup

### Initial system update

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl build-essential ufw
```

### Create swap file (required for builds on 2GB droplets)

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

Verify:

```bash
free -h
# Should show 2GB swap
```

### Install Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # v20.x.x
npm -v    # 10.x.x
```

### Install PostgreSQL 16

```bash
sudo apt install -y postgresql-16 postgresql-contrib-16
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

### Install PM2

```bash
sudo npm install -g pm2
```

### Install Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Create deploy user

```bash
sudo adduser deploy --disabled-password --gecos ""
sudo usermod -aG sudo deploy
# Copy your SSH key to the deploy user
sudo mkdir -p /home/deploy/.ssh
sudo cp ~/.ssh/authorized_keys /home/deploy/.ssh/
sudo chown -R deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys
```

### Configure firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

> **Important:** Always run application operations as the `deploy` user, never as root.

---

## 4. PostgreSQL Setup

```bash
sudo -u postgres psql
```

Inside `psql`:

```sql
CREATE USER revathy_app WITH PASSWORD 'your-strong-password-here';
CREATE DATABASE revathy_supermarket OWNER revathy_app;
GRANT ALL PRIVILEGES ON DATABASE revathy_supermarket TO revathy_app;
\q
```

Your connection string:

```
postgresql://revathy_app:your-strong-password-here@localhost:5432/revathy_supermarket?schema=public
```

---

## 5. Application Setup

Switch to the deploy user:

```bash
su - deploy
```

### Clone the repository

```bash
cd /home/deploy
git clone https://github.com/ekthar/revathysupermarket.git
cd revathysupermarket
```

### Install dependencies

```bash
npm ci
```

### Create environment file

```bash
nano apps/web/.env
```

Paste the full template below (replace all placeholder values):

```env
# ============================================================
# CORE / DATABASE
# ============================================================
NODE_ENV="production"
DATABASE_URL="postgresql://revathy_app:your-strong-password-here@localhost:5432/revathy_supermarket?schema=public"
DIRECT_DATABASE_URL="postgresql://revathy_app:your-strong-password-here@localhost:5432/revathy_supermarket?schema=public"

# ============================================================
# AUTHENTICATION
# ============================================================
AUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_SECRET="same-value-as-AUTH_SECRET"
AUTH_URL="https://yourdomain.com"
NEXTAUTH_URL="https://yourdomain.com"
NEXT_PUBLIC_SITE_URL="https://yourdomain.com"

# Google OAuth (optional - for Google sign-in)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# OTP settings
OTP_EXPIRY_SECONDS=300
OTP_MAX_ATTEMPTS=3
OTP_RATE_LIMIT_PER_10MIN=3

# ============================================================
# REDIS (Upstash HTTP REST - NOT local Redis)
# ============================================================
UPSTASH_REDIS_REST_URL="https://your-database.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-upstash-token"

# ============================================================
# STORE CONFIGURATION
# ============================================================
NEXT_PUBLIC_STORE_NAME="Revathy Supermarket"
NEXT_PUBLIC_STORE_ADDRESS="Your store address, Kerala, India"
STORE_LAT="8.644361"
STORE_LNG="76.843472"
ARRIVAL_RADIUS_METERS=250

# ============================================================
# GOOGLE MAPS
# ============================================================
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=""

# ============================================================
# FIREBASE (Push Notifications)
# ============================================================
FIREBASE_PROJECT_ID=""
# NOTE: FIREBASE_SERVICE_ACCOUNT_KEY cannot contain literal \n in .env files.
# Option A: Base64 encode the JSON and decode at runtime.
# Option B: Mount the service account JSON file and set a path variable.
# Option C: Use single-line JSON with escaped characters (fragile).
FIREBASE_SERVICE_ACCOUNT_KEY=""

# Firebase Client SDK
NEXT_PUBLIC_FIREBASE_API_KEY=""
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=""
NEXT_PUBLIC_FIREBASE_PROJECT_ID=""
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=""
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=""
NEXT_PUBLIC_FIREBASE_APP_ID=""
NEXT_PUBLIC_FIREBASE_VAPID_KEY=""

# ============================================================
# WEB PUSH (VAPID)
# ============================================================
NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY=""
WEB_PUSH_PRIVATE_KEY=""
WEB_PUSH_SUBJECT="mailto:owner@yourdomain.com"

# ============================================================
# WHATSAPP BUSINESS API
# ============================================================
WHATSAPP_PHONE_NUMBER_ID=""
WHATSAPP_API_TOKEN=""
WHATSAPP_VERIFY_TOKEN=""
WHATSAPP_APP_SECRET=""
WHATSAPP_BUSINESS_PHONE=""

# ============================================================
# SMS API
# ============================================================
SMS_API_KEY=""
SMS_SENDER_ID=""
SMS_API_URL=""

# ============================================================
# CLOUDFLARE R2 (Image/File Storage)
# ============================================================
CLOUDFLARE_R2_ACCOUNT_ID=""
CLOUDFLARE_R2_ACCESS_KEY_ID=""
CLOUDFLARE_R2_SECRET_ACCESS_KEY=""
CLOUDFLARE_R2_BUCKET=""
CLOUDFLARE_R2_PUBLIC_URL=""
NEXT_PUBLIC_R2_PUBLIC_URL=""

# ============================================================
# FEATURE FLAGS (UI Launch Controls)
# ============================================================
NEXT_PUBLIC_ENABLE_INSTALL_PROMPT="true"
NEXT_PUBLIC_ENABLE_REWARDS="true"
NEXT_PUBLIC_ENABLE_DELIVERY_SLOTS="true"

# ============================================================
# MOBILE / CAPACITOR
# ============================================================
# CAPACITOR_SERVER_URL="https://yourdomain.com"
# MOBILE_CORS_ORIGIN="https://yourdomain.com"

# ============================================================
# MONITORING (Optional)
# ============================================================
# SENTRY_DSN=""

# ============================================================
# DEVELOPMENT ONLY (never set in production)
# ============================================================
# EXPOSE_DEV_OTP="true"
```

Generate AUTH_SECRET:

```bash
openssl rand -base64 32
```

---

## 6. Database Migrations

Load environment:

```bash
cd /home/deploy/revathysupermarket/apps/web
set -a && source .env && set +a
```

### Fix known migration ordering issue

The migration `20250625120000_add_bill_number_to_return` references the `ReturnRequest` table which may not exist yet when migrations run in order. Fix by replacing its content with a comment:

```bash
echo '-- Skipped: ReturnRequest handled in later migration' > /home/deploy/revathysupermarket/apps/web/prisma/migrations/20250625120000_add_bill_number_to_return/migration.sql
```

### Run migrations

```bash
npx prisma generate
npx prisma migrate deploy
```

### Seed feature flags

```bash
npm run seed:flags
```

### Full database seed (optional, for initial data)

```bash
npx prisma db seed
```

Default admin credentials (if seeded):

```
Email: admin@msmsupermarket.in
Password: Admin@12345
```

> Change this password immediately after first login.

---

## 7. Build

The build requires approximately 3GB of memory. With 2GB RAM + 2GB swap, use:

```bash
cd /home/deploy/revathysupermarket/apps/web
NODE_OPTIONS="--max-old-space-size=3072" npm run build
```

Verify the build succeeded:

```bash
ls .next/BUILD_ID && echo "Build OK" || echo "BUILD FAILED"
```

---

## 8. Start with PM2

### Start the application

```bash
cd /home/deploy/revathysupermarket/apps/web
pm2 start npm --name "revathy" -- start
```

### Verify it is running

```bash
pm2 status
curl http://localhost:3000
```

### Save PM2 process list and enable startup

```bash
pm2 save
pm2 startup
# Run the command PM2 outputs (it will be something like:)
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u deploy --hp /home/deploy
```

Now PM2 will restart the app after reboots automatically.

---

## 9. Nginx Configuration

Create the site config:

```bash
sudo nano /etc/nginx/sites-available/revathy
```

Full configuration with SSE support, static caching, and security headers:

```nginx
upstream revathy_app {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL (managed by Certbot - paths updated after certbot runs)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Max upload size
    client_max_body_size 25m;

    # Static assets with long cache (Next.js hashed files)
    location /_next/static/ {
        proxy_pass http://revathy_app;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    # Public static files
    location /public/ {
        proxy_pass http://revathy_app;
        expires 30d;
        add_header Cache-Control "public";
    }

    # SSE (Server-Sent Events) support for live tracking
    location /api/orders/track {
        proxy_pass http://revathy_app;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # Main application
    location / {
        proxy_pass http://revathy_app;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }
}
```

Enable the site:

```bash
sudo ln -sf /etc/nginx/sites-available/revathy /etc/nginx/sites-enabled/revathy
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

---

## 10. Domain & SSL

### DNS Records

Add these DNS records at your domain registrar:

| Type | Name | Value           | TTL  |
|------|------|-----------------|------|
| A    | @    | YOUR_DROPLET_IP | 3600 |
| A    | www  | YOUR_DROPLET_IP | 3600 |

Wait for DNS propagation (can take up to 48 hours, usually minutes).

### Obtain SSL certificate

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### Verify SSL

```bash
curl -I https://yourdomain.com
sudo certbot renew --dry-run
```

SSL auto-renewal is handled by a systemd timer installed by Certbot.

---

## 11. Auto-Deploy from GitHub

A GitHub Actions workflow is provided at `.github/workflows/deploy.yml`. It automatically deploys when code is pushed to `main`.

See [deploy.yml](../.github/workflows/deploy.yml) for setup instructions, including:
- Generating an SSH key pair
- Adding secrets to GitHub repository settings (SERVER_IP, SSH_PRIVATE_KEY)

---

## 12. Deploy Script

Create a manual deploy script at `/home/deploy/deploy.sh`:

```bash
#!/bin/bash
set -e

echo "=== Deploying Revathy Supermarket ==="
echo "Started at: $(date)"

cd /home/deploy/revathysupermarket

echo "Pulling latest code..."
git pull origin main

echo "Installing dependencies..."
cd apps/web
npm ci

echo "Running migrations..."
npx prisma generate
npx prisma migrate deploy

echo "Building..."
NODE_OPTIONS="--max-old-space-size=3072" npm run build

echo "Verifying build..."
if [ ! -f .next/BUILD_ID ]; then
    echo "ERROR: Build failed - .next/BUILD_ID not found"
    exit 1
fi

echo "Restarting PM2..."
pm2 restart revathy

echo "=== Deploy complete at $(date) ==="
pm2 status
```

Make it executable:

```bash
chmod +x /home/deploy/deploy.sh
```

Usage:

```bash
su - deploy
./deploy.sh
```

---

## 13. Database Backups

### Backup script

Create `/home/deploy/backup-db.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/home/deploy/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="revathy_db_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

pg_dump -U revathy_app -h localhost revathy_supermarket | gzip > "${BACKUP_DIR}/${FILENAME}"

# Keep only last 7 days of backups
find "$BACKUP_DIR" -name "revathy_db_*.sql.gz" -mtime +7 -delete

echo "Backup created: ${FILENAME}"
```

Make executable and add to cron:

```bash
chmod +x /home/deploy/backup-db.sh
```

### Cron schedule (daily at 2 AM)

```bash
crontab -e
```

Add:

```cron
0 2 * * * /home/deploy/backup-db.sh >> /home/deploy/backups/backup.log 2>&1
```

### Restore from backup

```bash
gunzip -c /home/deploy/backups/revathy_db_YYYYMMDD_HHMMSS.sql.gz | psql -U revathy_app -h localhost revathy_supermarket
```

---

## 14. Monitoring & Maintenance

### PM2 Commands

```bash
pm2 status              # Process status
pm2 logs revathy        # Live logs
pm2 logs revathy --lines 100  # Last 100 lines
pm2 restart revathy     # Restart app
pm2 reload revathy      # Zero-downtime reload
pm2 stop revathy        # Stop app
pm2 monit               # Real-time monitoring dashboard
```

### Log management

```bash
# PM2 log rotation (install once)
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 50M
pm2 set pm2-logrotate:retain 7

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Disk cleanup

```bash
# Check disk usage
df -h

# Clear old PM2 logs
pm2 flush

# Clear npm cache
npm cache clean --force

# Clear old journal logs
sudo journalctl --vacuum-time=7d
```

### SSL renewal

SSL auto-renews via systemd timer. Verify:

```bash
sudo systemctl status certbot.timer
sudo certbot renew --dry-run
```

---

## 15. Troubleshooting

### OOM (Out of Memory) during build

**Symptom:** Build process killed, "JavaScript heap out of memory"

**Fix:**
```bash
# Ensure swap is active
free -h

# If no swap, create one
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Build with explicit memory limit
NODE_OPTIONS="--max-old-space-size=3072" npm run build
```

### Migration fails with "relation ReturnRequest does not exist"

**Symptom:** `prisma migrate deploy` fails on `20250625120000_add_bill_number_to_return`

**Fix:** This migration has a known ordering issue. Replace its content before running migrations:

```bash
echo '-- Skipped: ReturnRequest handled in later migration' > prisma/migrations/20250625120000_add_bill_number_to_return/migration.sql
npx prisma migrate deploy
```

### PM2 restart loops

**Symptom:** App keeps restarting (check with `pm2 status` showing high restart count)

**Fix:**
```bash
# Check logs for the error
pm2 logs revathy --lines 50

# Common causes:
# 1. Missing .env - verify file exists and is loaded
# 2. Port already in use - kill conflicting process
# 3. Missing build - run npm run build first

# Reset restart counter after fixing
pm2 reset revathy
```

### Port 3000 already in use

**Symptom:** "EADDRINUSE: address already in use :::3000"

**Fix:**
```bash
# Find and kill the process
lsof -i :3000
kill -9 <PID>

# Or use PM2 to manage properly
pm2 delete revathy
pm2 start npm --name "revathy" -- start
```

### Nginx 502 Bad Gateway

**Symptom:** Site shows 502 error

**Fix:**
```bash
# Check if app is running
pm2 status

# If stopped, start it
pm2 start revathy

# Check if app is listening on port 3000
curl http://localhost:3000

# Check Nginx config
sudo nginx -t
sudo systemctl reload nginx
```

### Google OAuth returns 502 Bad Gateway

**Symptom:** Clicking "Sign in with Google" shows a 502 error or fails at the callback URL

**Fix:**
1. Ensure `AUTH_URL` and `NEXTAUTH_URL` match your production domain exactly (including `https://`)
2. In Google Cloud Console, add the correct OAuth redirect URI:
   ```
   https://yourdomain.com/api/auth/callback/google
   ```
3. Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in your `.env`
4. Check that PM2 is running and the app responds on port 3000:
   ```bash
   curl http://localhost:3000/api/auth/providers
   ```
5. Check Nginx is proxying correctly:
   ```bash
   sudo nginx -t
   pm2 logs revathy --lines 20
   ```

### Firebase service account key issues

**Symptom:** Push notifications fail, Firebase errors in logs

**Fix:** The `FIREBASE_SERVICE_ACCOUNT_KEY` env var cannot contain literal `\n` characters in .env files. Solutions:

1. **Base64 encode** (recommended):
   ```bash
   # Encode
   base64 -w 0 service-account.json
   # Set FIREBASE_SERVICE_ACCOUNT_KEY to the base64 output
   # Decode in application or use a wrapper
   ```

2. **Mount JSON file:**
   ```bash
   # Place the file securely
   cp service-account.json /home/deploy/firebase-sa.json
   chmod 600 /home/deploy/firebase-sa.json
   # Reference path in env: GOOGLE_APPLICATION_CREDENTIALS="/home/deploy/firebase-sa.json"
   ```

---

## 16. Environment Variables Reference

| Variable | Required | Default | Description | Feature Flag |
|----------|----------|---------|-------------|--------------|
| `NODE_ENV` | Yes | - | Must be "production" | - |
| `DATABASE_URL` | Yes | - | PostgreSQL connection string | - |
| `DIRECT_DATABASE_URL` | Yes | - | Direct DB connection (same as DATABASE_URL for non-pooled) | - |
| `AUTH_SECRET` | Yes | - | NextAuth.js secret (min 32 chars) | - |
| `NEXTAUTH_SECRET` | Yes | - | Same as AUTH_SECRET | - |
| `AUTH_URL` | Yes | - | Full production URL | - |
| `NEXTAUTH_URL` | Yes | - | Same as AUTH_URL | - |
| `NEXT_PUBLIC_SITE_URL` | Yes | - | Public-facing site URL | - |
| `UPSTASH_REDIS_REST_URL` | Yes | - | Upstash Redis HTTP endpoint | - |
| `UPSTASH_REDIS_REST_TOKEN` | Yes | - | Upstash Redis auth token | - |
| `NEXT_PUBLIC_STORE_NAME` | Yes | - | Store display name | - |
| `NEXT_PUBLIC_STORE_ADDRESS` | Yes | - | Store address for display | - |
| `STORE_LAT` | Yes | - | Store latitude | - |
| `STORE_LNG` | Yes | - | Store longitude | - |
| `ARRIVAL_RADIUS_METERS` | No | 250 | Radius to trigger "arrived" status | - |
| `GOOGLE_CLIENT_ID` | No | - | Google OAuth client ID | - |
| `GOOGLE_CLIENT_SECRET` | No | - | Google OAuth client secret | - |
| `OTP_EXPIRY_SECONDS` | No | 300 | OTP validity duration | - |
| `OTP_MAX_ATTEMPTS` | No | 3 | Max OTP verification attempts | - |
| `OTP_RATE_LIMIT_PER_10MIN` | No | 3 | OTP requests per 10 minutes | - |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | No | - | Google Maps browser key | `ETA_MAP` flag |
| `FIREBASE_PROJECT_ID` | No | - | Firebase project ID | - |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | No | - | Firebase SA key (JSON, see notes) | - |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | No | - | Firebase client API key | - |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | No | - | Firebase auth domain | - |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | No | - | Firebase client project ID | - |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | No | - | Firebase storage bucket | - |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | No | - | FCM sender ID | - |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | No | - | Firebase app ID | - |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | No | - | Firebase VAPID key for web push | - |
| `NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY` | No | - | VAPID public key | - |
| `WEB_PUSH_PRIVATE_KEY` | No | - | VAPID private key | - |
| `WEB_PUSH_SUBJECT` | No | - | VAPID subject (mailto:) | - |
| `WHATSAPP_PHONE_NUMBER_ID` | No | - | WhatsApp Business phone ID | - |
| `WHATSAPP_API_TOKEN` | No | - | WhatsApp API permanent token | - |
| `WHATSAPP_VERIFY_TOKEN` | No | - | Webhook verification token | - |
| `WHATSAPP_APP_SECRET` | No | - | Meta app secret for signatures | - |
| `WHATSAPP_BUSINESS_PHONE` | No | - | Business phone number | - |
| `SMS_API_KEY` | No | - | SMS provider API key | - |
| `SMS_SENDER_ID` | No | - | SMS sender ID | - |
| `SMS_API_URL` | No | - | SMS provider endpoint | - |
| `CLOUDFLARE_R2_ACCOUNT_ID` | No | - | R2 account ID | - |
| `CLOUDFLARE_R2_ACCESS_KEY_ID` | No | - | R2 access key | - |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | No | - | R2 secret key | - |
| `CLOUDFLARE_R2_BUCKET` | No | - | R2 bucket name | - |
| `CLOUDFLARE_R2_PUBLIC_URL` | No | - | R2 public URL | - |
| `NEXT_PUBLIC_R2_PUBLIC_URL` | No | - | R2 public URL (client-side) | - |
| `NEXT_PUBLIC_ENABLE_INSTALL_PROMPT` | No | "true" | Show PWA install prompt | UI control |
| `NEXT_PUBLIC_ENABLE_REWARDS` | No | "true" | Enable rewards feature | UI control |
| `NEXT_PUBLIC_ENABLE_DELIVERY_SLOTS` | No | "true" | Enable delivery slot selection | UI control |
| `CAPACITOR_SERVER_URL` | No | - | Override URL for Capacitor apps | - |
| `MOBILE_CORS_ORIGIN` | No | - | CORS origin for mobile API routes | - |
| `SENTRY_DSN` | No | - | Sentry error tracking DSN | - |
| `EXPOSE_DEV_OTP` | No | - | NEVER set in production | Dev only |
