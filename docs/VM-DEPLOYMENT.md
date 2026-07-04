# Deploying Revathy/MSM Supermarket To Another VM

This note describes a production-style deployment of the web app on a Linux VM using Node.js, PostgreSQL, Nginx, and systemd.

## 1. Server Prerequisites

Use Ubuntu 22.04 or newer.

```bash
sudo apt update
sudo apt install -y git curl nginx postgresql postgresql-contrib
```

Install Node.js 20 LTS or newer:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

## 2. Clone The Project

```bash
sudo mkdir -p /var/www
sudo chown "$USER":"$USER" /var/www
cd /var/www
git clone https://github.com/ekthar/revathysupermarket.git
cd revathysupermarket
npm install
```

## 3. Create The Production Database

Example local PostgreSQL setup:

```bash
sudo -u postgres psql
```

Inside `psql`:

```sql
CREATE USER revathy_app WITH PASSWORD 'replace-with-strong-password';
CREATE DATABASE revathy_supermarket OWNER revathy_app;
GRANT ALL PRIVILEGES ON DATABASE revathy_supermarket TO revathy_app;
\q
```

Your `DATABASE_URL` will look like:

```env
DATABASE_URL="postgresql://revathy_app:replace-with-strong-password@localhost:5432/revathy_supermarket?schema=public"
DIRECT_DATABASE_URL="postgresql://revathy_app:replace-with-strong-password@localhost:5432/revathy_supermarket?schema=public"
```

## 4. Create Environment File

Create `apps/web/.env.production`:

```bash
nano apps/web/.env.production
```

Minimum required values:

```env
NODE_ENV="production"

DATABASE_URL="postgresql://revathy_app:replace-with-strong-password@localhost:5432/revathy_supermarket?schema=public"
DIRECT_DATABASE_URL="postgresql://revathy_app:replace-with-strong-password@localhost:5432/revathy_supermarket?schema=public"

AUTH_SECRET="generate-a-long-random-secret"
NEXTAUTH_SECRET="same-value-as-AUTH_SECRET"
AUTH_URL="https://your-domain.com"
NEXTAUTH_URL="https://your-domain.com"
NEXT_PUBLIC_SITE_URL="https://your-domain.com"

UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

NEXT_PUBLIC_STORE_NAME="Revathy Supermarket"
NEXT_PUBLIC_STORE_ADDRESS="Your store address"
STORE_LAT="8.644361"
STORE_LNG="76.843472"
```

Generate a secret:

```bash
openssl rand -base64 32
```

Optional production integrations:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=""

WHATSAPP_PHONE_NUMBER_ID=""
WHATSAPP_API_TOKEN=""
WHATSAPP_VERIFY_TOKEN=""
WHATSAPP_APP_SECRET=""
WHATSAPP_BUSINESS_PHONE=""

FIREBASE_PROJECT_ID=""
FIREBASE_SERVICE_ACCOUNT_KEY=""
NEXT_PUBLIC_FIREBASE_API_KEY=""
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=""
NEXT_PUBLIC_FIREBASE_PROJECT_ID=""
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=""
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=""
NEXT_PUBLIC_FIREBASE_APP_ID=""
NEXT_PUBLIC_FIREBASE_VAPID_KEY=""

NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY=""
WEB_PUSH_PRIVATE_KEY=""
WEB_PUSH_SUBJECT="mailto:owner@example.com"

CLOUDFLARE_R2_ACCOUNT_ID=""
CLOUDFLARE_R2_ACCESS_KEY_ID=""
CLOUDFLARE_R2_SECRET_ACCESS_KEY=""
CLOUDFLARE_R2_BUCKET=""
CLOUDFLARE_R2_PUBLIC_URL=""
NEXT_PUBLIC_R2_PUBLIC_URL=""
```

Important: production builds intentionally require `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.

## 5. Run Migrations And Seed Flags

Load the env file for commands:

```bash
set -a
. apps/web/.env.production
set +a
```

Run migrations and seed feature flags:

```bash
npm run db:migrate --workspace=@msm/web
npm run seed:flags --workspace=@msm/web
```

For a fresh empty database, run the full seed only if you want starter/admin data:

```bash
npm run seed --workspace=@msm/web
```

Default seed admin, if seeded:

```text
Email: admin@msmsupermarket.in
Password: Admin@12345
```

Change this password immediately after first login.

## 6. Build The Web App

```bash
set -a
. apps/web/.env.production
set +a

npm run build:web
```

## 7. Create A systemd Service

Create:

```bash
sudo nano /etc/systemd/system/revathy-web.service
```

Paste:

```ini
[Unit]
Description=Revathy Supermarket Web App
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/revathysupermarket/apps/web
EnvironmentFile=/var/www/revathysupermarket/apps/web/.env.production
Environment=PORT=3000
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Give `www-data` access:

```bash
sudo chown -R www-data:www-data /var/www/revathysupermarket
```

Start the app:

```bash
sudo systemctl daemon-reload
sudo systemctl enable revathy-web
sudo systemctl start revathy-web
sudo systemctl status revathy-web
```

View logs:

```bash
sudo journalctl -u revathy-web -f
```

## 8. Configure Nginx Reverse Proxy

Create:

```bash
sudo nano /etc/nginx/sites-available/revathy-web
```

Paste and replace `your-domain.com`:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    client_max_body_size 25m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable it:

```bash
sudo ln -s /etc/nginx/sites-available/revathy-web /etc/nginx/sites-enabled/revathy-web
sudo nginx -t
sudo systemctl reload nginx
```

## 9. Add HTTPS

Install Certbot:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Verify renewal:

```bash
sudo certbot renew --dry-run
```

## 10. Deploy Updates Later

```bash
cd /var/www/revathysupermarket
sudo -u www-data git pull origin main

set -a
. apps/web/.env.production
set +a

sudo -u www-data npm install
sudo -u www-data npm run db:migrate --workspace=@msm/web
sudo -u www-data npm run seed:flags --workspace=@msm/web
sudo -u www-data npm run build:web
sudo systemctl restart revathy-web
sudo journalctl -u revathy-web -n 100 --no-pager
```

## 11. Health Checks

Check the app:

```bash
curl -I https://your-domain.com
```

Check production rate-limit configuration:

```bash
curl https://your-domain.com/api/health/security
```

Check process:

```bash
sudo systemctl status revathy-web
sudo journalctl -u revathy-web -f
```

## 12. Common Problems

### Build fails with missing Upstash variables

Set these in `apps/web/.env.production`:

```env
UPSTASH_REDIS_REST_URL="..."
UPSTASH_REDIS_REST_TOKEN="..."
```

### Login callback redirects to the wrong domain

Update:

```env
AUTH_URL="https://your-domain.com"
NEXTAUTH_URL="https://your-domain.com"
NEXT_PUBLIC_SITE_URL="https://your-domain.com"
```

Then rebuild and restart.

### Images or upload evidence fail

Configure Cloudflare R2 variables, then restart the service.

### Push notifications do not work

Configure Firebase and Web Push variables. See `docs/firebase-setup.md`.

### Customer checkout slots do not show

Confirm slots are active, have future end times, and are within the customer slot window. Then check:

```bash
curl https://your-domain.com/api/delivery-slots
```

You must be authenticated for this API, so test it from a logged-in browser if `curl` returns unauthorized.

