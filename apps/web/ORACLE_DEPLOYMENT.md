# Oracle Cloud VM Deployment Guide

## Architecture

```
┌─────────────────────────────────────────────────┐
│              Oracle Cloud VCN                     │
│                                                   │
│  ┌───────────────────┐  ┌─────────────────────┐ │
│  │   App VM (ARM)    │  │   DB VM (optional)  │ │
│  │                   │  │                     │ │
│  │  • Next.js (PM2)  │  │  • PostgreSQL 16    │ │
│  │  • Node.js 20+    │  │  • Port 5432        │ │
│  │  • Port 3000      │  │  • Internal only    │ │
│  │                   │  │                     │ │
│  └────────┬──────────┘  └──────────┬──────────┘ │
│           │     Private Subnet      │            │
│           └─────────────────────────┘            │
│                                                   │
│  ┌───────────────────┐                           │
│  │   Load Balancer   │  (Public IP + SSL)        │
│  │   Port 443 → 3000│                           │
│  └───────────────────┘                           │
└─────────────────────────────────────────────────┘
```

## Changes from Neon (Serverless) to Oracle VM (Self-hosted)

| Aspect | Before (Neon) | After (Oracle VM) |
|--------|--------------|-------------------|
| Connection | HTTP/WebSocket via adapter | Direct TCP |
| Adapter | `@prisma/adapter-neon` | None (standard Prisma) |
| Pooling | Neon's built-in proxy | Prisma connection pool |
| Cold start | ~200-400ms (TLS handshake) | ~0ms (persistent process) |
| Schema | `directUrl` for migrations | Single `url` |
| Scale | Auto-sleep, auto-scale | Fixed VM resources |

## Prerequisites

1. **Oracle Cloud VM** (ARM Ampere A1 recommended — free tier: 4 OCPU, 24GB RAM)
2. **PostgreSQL 16** installed on same VM or separate DB VM
3. **Node.js 20+** (use nvm or official Oracle Linux repos)
4. **PM2** for process management
5. **Nginx** or Oracle Load Balancer for SSL termination

## Setup Steps

### 1. PostgreSQL Setup

```bash
# Install PostgreSQL 16
sudo dnf install -y postgresql16-server postgresql16
sudo postgresql-setup --initdb

# Start and enable
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql
CREATE DATABASE msm_supermarket;
CREATE USER msm WITH ENCRYPTED PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE msm_supermarket TO msm;
\q

# Configure pg_hba.conf for local connections
# /var/lib/pgsql/16/data/pg_hba.conf
# local   all   msm   scram-sha-256
# host    all   msm   10.0.0.0/24   scram-sha-256  (for VCN internal)

# Tune postgresql.conf for your VM
# shared_buffers = 6GB          (25% of RAM)
# effective_cache_size = 18GB   (75% of RAM)
# max_connections = 100
# work_mem = 64MB
# maintenance_work_mem = 512MB
```

### 2. Application Setup

```bash
# Clone repository
git clone <repo-url> /opt/msm
cd /opt/msm

# Install dependencies
npm install

# Setup environment
cp apps/web/.env.example apps/web/.env
# Edit .env with your Oracle VM database URL:
# DATABASE_URL="postgresql://msm:your-password@localhost:5432/msm_supermarket?connection_limit=20&pool_timeout=10"

# Generate Prisma client
cd apps/web
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed data (optional)
npx tsx -r dotenv/config prisma/seed.ts

# Build
npm run build

# Start with PM2
pm2 start npm --name "msm-web" -- start
pm2 save
pm2 startup
```

### 3. Nginx Reverse Proxy (SSL)

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

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
    }
}
```

### 4. Environment Variables

```bash
# Required for Oracle VM deployment
DATABASE_URL="postgresql://msm:password@localhost:5432/msm_supermarket?connection_limit=20&pool_timeout=10"
NEXTAUTH_SECRET="your-secret"
AUTH_SECRET="your-secret"
NEXTAUTH_URL="https://yourdomain.com"
AUTH_URL="https://yourdomain.com"
NEXT_PUBLIC_SITE_URL="https://yourdomain.com"

# Redis (keep Upstash or self-host Redis on VM)
UPSTASH_REDIS_REST_URL="https://your-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token"
# OR for self-hosted Redis:
# REDIS_URL="redis://localhost:6379"

# All other env vars remain the same
```

## Connection Pool Configuration

For a single Next.js instance on Oracle VM:

```
?connection_limit=20&pool_timeout=10
```

- `connection_limit=20`: Prisma maintains up to 20 persistent TCP connections
- `pool_timeout=10`: Wait max 10s for a connection from pool

For multiple instances (PM2 cluster mode):
- `connection_limit = max_connections / num_instances`
- Example: 100 max_connections / 4 PM2 instances = 25 per instance

## Performance Notes

| Metric | Neon Serverless | Oracle VM Self-hosted |
|--------|----------------|----------------------|
| Query latency | 5-15ms (HTTP overhead) | 1-3ms (local TCP) |
| Connection time | 200-400ms (cold start) | 0ms (persistent pool) |
| Max connections | 100 (Neon limit) | 100+ (configurable) |
| Cost | Usage-based | Fixed (free tier available) |
| Maintenance | Zero | Self-managed |

## Monitoring

```bash
# Check PostgreSQL connections
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"

# Check PM2 status
pm2 status
pm2 logs msm-web

# PostgreSQL slow queries
sudo -u postgres psql -c "SELECT * FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 10;"
```
