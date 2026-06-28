# Full Production Setup Guide

## Oracle Cloud VM (Backend + DB) + Cloudflare Pages (Frontend)

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                          INTERNET                                      │
│                                                                        │
│   Customer → https://yourstore.com (Cloudflare Pages)                 │
│                    │                                                   │
│                    ▼                                                   │
│   ┌────────────────────────────────────────┐                          │
│   │        CLOUDFLARE PAGES                 │                          │
│   │                                         │                          │
│   │  • Next.js SSR (Edge Runtime)           │                          │
│   │  • Static assets (CDN cached)           │                          │
│   │  • Custom domain + free SSL             │                          │
│   │  • API routes → proxied to Oracle VM    │                          │
│   │                                         │                          │
│   └───────────────────┬─────────────────────┘                          │
│                       │ API calls                                      │
│                       ▼                                                │
│   ┌──────────────────────────────────────────┐                        │
│   │        ORACLE CLOUD VM                    │                        │
│   │        (ARM Ampere A1 Free Tier)          │                        │
│   │                                           │                        │
│   │  ┌─────────────────────────────────────┐ │                        │
│   │  │  PostgreSQL 16                       │ │                        │
│   │  │  Port 5432 (localhost only)          │ │                        │
│   │  │  • All data (orders, products, etc.) │ │                        │
│   │  └─────────────────────────────────────┘ │                        │
│   │                                           │                        │
│   │  ┌─────────────────────────────────────┐ │                        │
│   │  │  Next.js API Server (PM2)            │ │                        │
│   │  │  Port 3000 (behind Nginx)            │ │                        │
│   │  │  • API routes                        │ │                        │
│   │  │  • SSR pages                         │ │                        │
│   │  │  • Prisma → PostgreSQL               │ │                        │
│   │  └─────────────────────────────────────┘ │                        │
│   │                                           │                        │
│   │  ┌─────────────────────────────────────┐ │                        │
│   │  │  Nginx                               │ │                        │
│   │  │  Port 443 (SSL) → Port 3000          │ │                        │
│   │  └─────────────────────────────────────┘ │                        │
│   └──────────────────────────────────────────┘                        │
└──────────────────────────────────────────────────────────────────────┘
```

> **Note:** For the simplest deployment, you can host EVERYTHING on the Oracle VM
> (Next.js serves both frontend + API). Cloudflare Pages is optional and adds
> CDN speed for static assets. The guide covers both approaches.

---

## OPTION A: Everything on Oracle VM (Simplest)

This deploys the full Next.js app (frontend + API + SSR) on the Oracle VM.
Cloudflare is used only as a DNS proxy + CDN (free plan).

---

### Step 1: Create Oracle Cloud VM

1. Go to [Oracle Cloud Console](https://cloud.oracle.com)
2. Create an **Always Free** Ampere A1 instance:
   - Shape: `VM.Standard.A1.Flex` (up to 4 OCPU, 24GB RAM free)
   - OS: **Oracle Linux 9** or **Ubuntu 22.04**
   - Boot volume: 200GB (free)
   - VCN: Create new with public subnet
3. Add **Ingress Rules** to Security List:
   - Port 22 (SSH)
   - Port 80 (HTTP)
   - Port 443 (HTTPS)
4. Note the **Public IP** of your VM

### Step 2: SSH and Install Dependencies

```bash
# SSH into VM
ssh -i your-key.pem opc@<PUBLIC_IP>

# Update system
sudo dnf update -y

# ─── Install Node.js 20 ───
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs

# Verify
node --version   # v20.x.x
npm --version    # 10.x.x

# ─── Install PostgreSQL 16 ───
sudo dnf install -y postgresql16-server postgresql16
sudo postgresql-setup --initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql

# ─── Install Nginx ───
sudo dnf install -y nginx
sudo systemctl enable nginx

# ─── Install PM2 ───
sudo npm install -g pm2

# ─── Install Git ───
sudo dnf install -y git
```

### Step 3: Configure PostgreSQL

```bash
# Switch to postgres user
sudo -u postgres psql

-- Create database and user
CREATE DATABASE msm_supermarket;
CREATE USER msm WITH ENCRYPTED PASSWORD 'YourStrongPassword123!';
GRANT ALL PRIVILEGES ON DATABASE msm_supermarket TO msm;
ALTER DATABASE msm_supermarket OWNER TO msm;

-- Grant schema permissions (required for Prisma migrations)
\c msm_supermarket
GRANT ALL ON SCHEMA public TO msm;

\q
```

Now edit `pg_hba.conf` to allow password auth:

```bash
# Find the config file
sudo find / -name pg_hba.conf 2>/dev/null
# Usually: /var/lib/pgsql/16/data/pg_hba.conf

sudo nano /var/lib/pgsql/16/data/pg_hba.conf
```

Change the `local` and `host` lines from `peer`/`ident` to `scram-sha-256`:

```
# TYPE  DATABASE    USER    ADDRESS         METHOD
local   all         all                     scram-sha-256
host    all         all     127.0.0.1/32    scram-sha-256
host    all         all     ::1/128         scram-sha-256
```

Optionally tune `postgresql.conf`:

```bash
sudo nano /var/lib/pgsql/16/data/postgresql.conf
```

```ini
# Memory (adjust for your VM size)
shared_buffers = 4GB              # 25% of RAM (for 16GB VM)
effective_cache_size = 12GB       # 75% of RAM
work_mem = 64MB
maintenance_work_mem = 512MB

# Connections
max_connections = 100

# WAL
wal_buffers = 64MB
checkpoint_completion_target = 0.9

# Query planning
random_page_cost = 1.1            # SSD storage
effective_io_concurrency = 200
```

Restart PostgreSQL:

```bash
sudo systemctl restart postgresql
```

Test connection:

```bash
psql "postgresql://msm:YourStrongPassword123!@localhost:5432/msm_supermarket"
# Should connect successfully. Type \q to exit.
```

### Step 4: Deploy Application

```bash
# Clone the repository (oracle branch)
cd /opt
sudo git clone -b oracle https://github.com/ekthar/revathysupermarket.git msm
sudo chown -R opc:opc /opt/msm
cd /opt/msm

# Install all dependencies (monorepo)
npm install

# Navigate to web app
cd apps/web

# Create .env file
cp .env.example .env
nano .env
```

**Edit `.env` with your values:**

```env
# ─── DATABASE ───
DATABASE_URL="postgresql://msm:YourStrongPassword123!@localhost:5432/msm_supermarket?connection_limit=20&pool_timeout=10"

# ─── AUTH ───
NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"
AUTH_SECRET="same-as-above"
NEXTAUTH_URL="https://yourdomain.com"
AUTH_URL="https://yourdomain.com"
NEXT_PUBLIC_SITE_URL="https://yourdomain.com"

# ─── STORE ───
NEXT_PUBLIC_STORE_NAME="Your Store Name"
NEXT_PUBLIC_STORE_ADDRESS="Your Address, City"
STORE_LAT="8.644361"
STORE_LNG="76.843472"

# ─── REDIS (keep Upstash for rate limiting) ───
UPSTASH_REDIS_REST_URL="https://your-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token"

# ─── IMAGES (Cloudflare R2) ───
CLOUDFLARE_R2_PUBLIC_URL="https://your-bucket.r2.dev"
CLOUDFLARE_R2_ACCOUNT_ID="your-account-id"
CLOUDFLARE_R2_ACCESS_KEY_ID="your-key"
CLOUDFLARE_R2_SECRET_ACCESS_KEY="your-secret"
CLOUDFLARE_R2_BUCKET="your-bucket-name"

# ─── GOOGLE OAUTH ───
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"

# ─── FIREBASE (Push Notifications) ───
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
NEXT_PUBLIC_FIREBASE_API_KEY="your-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"
NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789:web:abcdef"
NEXT_PUBLIC_FIREBASE_VAPID_KEY="your-vapid-key"
```

### Step 5: Run Prisma Migrations + Seed Database

```bash
cd /opt/msm/apps/web

# Generate Prisma Client
npx prisma generate

# Run all migrations (creates tables, indexes, etc.)
npx prisma migrate deploy

# ─── SEED THE DATABASE ───
# This creates:
#   • Admin user (admin@msmsupermarket.in / Admin@12345)
#   • All product categories (Fruits, Vegetables, Dairy, etc.)
#   • Sample products with images and pricing
#   • Default store settings
#   • Homepage banner

npx tsx -r dotenv/config prisma/seed.ts
```

**Expected output:**
```
Seeded admin user: admin@msmsupermarket.in
Seeded 9 categories
Seeded 45 products
Seeded 1 banner
Seeded 5 store settings
```

**Verify seed worked:**
```bash
psql "postgresql://msm:YourStrongPassword123!@localhost:5432/msm_supermarket" \
  -c "SELECT count(*) as products FROM \"Product\";"
  -c "SELECT count(*) as categories FROM \"Category\";"
  -c "SELECT email, role FROM \"User\" WHERE role = 'ADMIN';"
```

### Step 6: Build and Start

```bash
cd /opt/msm/apps/web

# Build production bundle
npm run build

# Start with PM2
pm2 start npm --name "msm-web" -- start
pm2 save
pm2 startup  # Follow the printed command to enable on boot
```

**Verify it's running:**
```bash
pm2 status
curl http://localhost:3000  # Should return HTML
```

### Step 7: Configure Nginx + SSL

```bash
# Install certbot for free SSL
sudo dnf install -y certbot python3-certbot-nginx

# Create Nginx config
sudo nano /etc/nginx/conf.d/msm.conf
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;  # For SSE connections
    }

    # Static files cache
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

```bash
# Test and start Nginx
sudo nginx -t
sudo systemctl start nginx

# Get SSL certificate (point your domain DNS to VM IP first!)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## OPTION B: Cloudflare Pages (Frontend) + Oracle VM (API only)

> **Important:** Next.js on Cloudflare Pages has limitations:
> - No native Node.js runtime (uses Workers/Edge runtime)
> - Some Node.js APIs unavailable (crypto, fs, etc.)
> - `@opennextjs/cloudflare` adapter required
> - Prisma needs Edge-compatible adapter
>
> **Recommendation:** For this app, Option A (full app on Oracle VM + Cloudflare as CDN proxy) is simpler and avoids Edge runtime compatibility issues.

### If you still want Cloudflare Pages as CDN:

Use **Cloudflare as a reverse proxy** in front of your Oracle VM (not as the app host):

### Step 1: Add Domain to Cloudflare

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Click **"Add a Site"** → enter your domain
3. Select **Free plan**
4. Cloudflare gives you nameservers → update at your registrar

### Step 2: DNS Configuration

Add an **A record** pointing to your Oracle VM:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| A | @ | `<ORACLE_VM_PUBLIC_IP>` | ✅ Proxied (orange cloud) |
| A | www | `<ORACLE_VM_PUBLIC_IP>` | ✅ Proxied (orange cloud) |

The **orange cloud (Proxied)** means Cloudflare sits in front of your VM:
- Free SSL (no need for certbot)
- CDN caching for static assets
- DDoS protection
- Web Application Firewall

### Step 3: Cloudflare SSL Settings

In Cloudflare Dashboard → SSL/TLS:
- Mode: **Full (strict)** if you have certbot on VM, or **Full** if self-signed
- OR: **Flexible** (Cloudflare handles SSL, talks HTTP to your VM)

For simplest setup, use **Flexible**:
- Cloudflare handles SSL (https://yourdomain.com → visitor)
- Cloudflare connects to your VM on port 80 (HTTP)
- Change Nginx to listen on port 80 only (no certbot needed)

### Step 4: Cloudflare Page Rules (Optional Caching)

Create page rules for static asset caching:

| URL Pattern | Setting | Value |
|-------------|---------|-------|
| `yourdomain.com/_next/static/*` | Cache Level | Cache Everything |
| `yourdomain.com/_next/static/*` | Edge TTL | 1 month |
| `yourdomain.com/icons/*` | Cache Level | Cache Everything |

### Step 5: Update Your .env

```env
NEXTAUTH_URL="https://yourdomain.com"
AUTH_URL="https://yourdomain.com"
NEXT_PUBLIC_SITE_URL="https://yourdomain.com"
```

---

## Database Seeding Reference

### What the seed creates:

| Entity | Details |
|--------|---------|
| Admin user | `admin@msmsupermarket.in` / `Admin@12345` (CHANGE IN PRODUCTION!) |
| Categories | Fruits, Vegetables, Dairy, Beverages, Snacks, Household, Personal Care, Frozen Foods, Grocery Essentials |
| Products | ~45 products with images, prices, stock levels, popularity scores |
| Banner | Homepage "Weekend Freshness Sale" banner |
| Settings | Store name, address, phone, WhatsApp, delivery radius |

### Commands:

```bash
# Run seed (first time)
npx tsx -r dotenv/config prisma/seed.ts

# Reset database and re-seed (CAUTION: deletes all data!)
npx prisma migrate reset

# Open Prisma Studio (visual DB browser)
npx prisma studio
# Opens at http://localhost:5555 — browse/edit data visually

# Run a specific migration
npx prisma migrate deploy

# Check migration status
npx prisma migrate status
```

### Adding Your Own Products:

After seeding, log into the admin panel:
1. Go to `https://yourdomain.com/admin/login`
2. Email: `admin@msmsupermarket.in` / Password: `Admin@12345`
3. Add/edit products, categories, banners, delivery partners via admin UI

---

## Quick Start Summary (Copy-Paste)

```bash
# === ON YOUR ORACLE VM ===

# 1. Install everything
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs postgresql16-server postgresql16 nginx git
sudo npm install -g pm2
sudo postgresql-setup --initdb
sudo systemctl start postgresql && sudo systemctl enable postgresql

# 2. Setup database
sudo -u postgres psql -c "CREATE DATABASE msm_supermarket;"
sudo -u postgres psql -c "CREATE USER msm WITH ENCRYPTED PASSWORD 'YourPassword123!';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE msm_supermarket TO msm;"
sudo -u postgres psql -d msm_supermarket -c "GRANT ALL ON SCHEMA public TO msm;"

# 3. Fix pg_hba.conf (change peer → scram-sha-256)
sudo sed -i 's/peer/scram-sha-256/g' /var/lib/pgsql/16/data/pg_hba.conf
sudo sed -i 's/ident/scram-sha-256/g' /var/lib/pgsql/16/data/pg_hba.conf
sudo systemctl restart postgresql

# 4. Clone and setup app
cd /opt && sudo git clone -b oracle https://github.com/ekthar/revathysupermarket.git msm
sudo chown -R $USER:$USER /opt/msm && cd /opt/msm
npm install

# 5. Configure environment
cd apps/web && cp .env.example .env
# EDIT .env with your DATABASE_URL, secrets, domain, etc.

# 6. Database: generate + migrate + seed
npx prisma generate
npx prisma migrate deploy
npx tsx -r dotenv/config prisma/seed.ts

# 7. Build and start
npm run build
pm2 start npm --name "msm" -- start
pm2 save && pm2 startup

# 8. Nginx (edit config, then)
sudo systemctl start nginx

# 9. Point domain DNS to VM IP (A record)
# 10. Get SSL: sudo certbot --nginx -d yourdomain.com
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `prisma migrate deploy` fails | Check `DATABASE_URL` in `.env`, ensure postgres is running |
| Seed fails with "category not found" | Migrations must run first (`prisma migrate deploy`) |
| `ECONNREFUSED 127.0.0.1:5432` | PostgreSQL not running: `sudo systemctl start postgresql` |
| `password authentication failed` | Check pg_hba.conf uses `scram-sha-256`, not `peer` |
| Port 3000 not accessible externally | Check Oracle Cloud Security List ingress rules |
| SSL certificate fails | DNS must point to VM IP first (wait for propagation) |
| PM2 restart loop | Check logs: `pm2 logs msm` — usually missing env vars |
