# New Customer Setup Guide

Complete guide to deploy this grocery ordering website for a new supermarket customer.

---

## Quick Overview

| Step | What | Time |
|------|------|------|
| 1 | Create PostgreSQL database | 5 min |
| 2 | Configure environment variables | 10 min |
| 3 | Deploy to Vercel | 10 min |
| 4 | Run migrations & seed | 5 min |
| 5 | Configure store in admin panel | 10 min |
| 6 | Add products | ongoing |

**Total setup time: ~40 minutes**

---

## Step 1: Create PostgreSQL Database

### Option A: Neon (Free tier available)
1. Go to [neon.tech](https://neon.tech)
2. Create a new project (name: customer's shop name)
3. Copy the connection string:
   ```
   postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```

### Option B: Supabase (Free tier available)
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings > Database > Connection string (URI)
4. Copy the connection string

### Option C: Railway
1. Go to [railway.app](https://railway.app)
2. Create a PostgreSQL service
3. Copy the `DATABASE_URL` from variables

---

## Step 2: Configure Environment Variables

Create a `.env` file (or set in Vercel dashboard). Here's what each one means:

```env
# === REQUIRED ===

# Database (from Step 1)
DATABASE_URL="postgresql://user:pass@host/dbname?sslmode=require"

# Auth secrets (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET="your-random-64-char-secret"
AUTH_SECRET="same-secret-as-above"

# URLs (update after deployment)
NEXTAUTH_URL="https://customerdomain.vercel.app"
AUTH_URL="https://customerdomain.vercel.app"
NEXT_PUBLIC_SITE_URL="https://customerdomain.vercel.app"

# === STORE BRANDING (fallback if DB settings not loaded) ===
NEXT_PUBLIC_STORE_NAME="Customer Shop Name"
NEXT_PUBLIC_STORE_ADDRESS="Location, State, India"

# === OPTIONAL (enable features) ===

# Image uploads (Cloudflare R2 or S3-compatible)
S3_BUCKET="customer-uploads"
CLOUDFLARE_R2_PUBLIC_URL=""
CLOUDFLARE_R2_ACCOUNT_ID=""
CLOUDFLARE_R2_ACCESS_KEY_ID=""
CLOUDFLARE_R2_SECRET_ACCESS_KEY=""
CLOUDFLARE_R2_BUCKET="customer-products"

# WhatsApp notifications (needs Meta Business account)
WHATSAPP_PHONE_NUMBER_ID=""
WHATSAPP_API_TOKEN=""
WHATSAPP_VERIFY_TOKEN=""
WHATSAPP_BUSINESS_PHONE=""

# Google login (optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Web push notifications
NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY=""
WEB_PUSH_PRIVATE_KEY=""
WEB_PUSH_SUBJECT="mailto:customer@email.com"

# Delivery pincodes (comma-separated 6-digit codes)
NEXT_PUBLIC_SERVICEABLE_PINCODES="695121,695122,695123"

# Store coordinates (used for distance calculation fallback)
STORE_LAT="8.4004"
STORE_LNG="77.0851"
```

---

## Step 3: Deploy to Vercel

### First-time setup:
```bash
# 1. Fork or clone the repository for this customer
git clone <repo-url> customer-shop
cd customer-shop

# 2. Update package.json name (optional)
# Edit "name" field to customer's shop slug

# 3. Push to a new GitHub repo for this customer
git remote set-url origin https://github.com/yourorg/customer-shop.git
git push -u origin main

# 4. Connect to Vercel
# Go to vercel.com > Import Project > Select the repo
# Add all environment variables from Step 2
# Deploy!
```

### After deployment:
1. Note the deployment URL (e.g., `customer-shop.vercel.app`)
2. Update `NEXTAUTH_URL`, `AUTH_URL`, and `NEXT_PUBLIC_SITE_URL` to this URL
3. If customer has a custom domain, add it in Vercel > Settings > Domains

---

## Step 4: Run Database Migrations & Seed

```bash
# Run from your local machine (or Vercel CLI)

# Set DATABASE_URL to the production database
export DATABASE_URL="postgresql://..."

# Run migrations (creates all tables)
npx prisma migrate deploy

# Seed initial data (admin user, sample products, categories)
npx prisma db seed
```

This creates:
- Admin user: `admin@msmsupermarket.in` / `Admin@12345`
- 9 product categories
- Sample products
- Default store settings

**IMPORTANT:** Change the admin email/password immediately after first login!

---

## Step 5: Configure Store in Admin Panel

### 5.1 Login to Admin
1. Go to `https://yoursite.com/admin/login`
2. Login with seed credentials: `admin@msmsupermarket.in` / `Admin@12345`

### 5.2 Update Store Settings (Admin > Settings)

| Setting | What to enter |
|---------|---------------|
| **Store Name** | Customer's actual shop name (e.g., "Lakshmi Supermarket") |
| **Address** | Full address (e.g., "MG Road, Trivandrum, Kerala") |
| **Phone** | Shop phone number |
| **WhatsApp** | WhatsApp number with country code (e.g., 919876543210) |
| **Store Latitude** | Get from Google Maps (right-click shop location > coordinates) |
| **Store Longitude** | Same as above |
| **Delivery Radius** | How far they deliver (in KM) |
| **Serviceable Pincodes** | All pincodes they deliver to |
| **Store Open Time** | Opening time (24h format, e.g., "08:00") |
| **Store Close Time** | Closing time (e.g., "21:00") |
| **Minimum Order** | Minimum order value in rupees |

### 5.3 Get Store Coordinates

1. Open [Google Maps](https://maps.google.com)
2. Search for the shop or navigate to its location
3. Right-click on the exact shop location
4. Click the coordinates that appear (they get copied)
5. Format: `latitude, longitude` (e.g., `8.4004, 77.0851`)
6. Enter latitude and longitude separately in settings

### 5.4 Upload Logo
- In Admin > Settings > Store Logo section
- Either upload a file OR paste any image URL
- Supports: Unsplash links, Imgur, any HTTPS image URL

### 5.5 Change Admin Password
1. Go to Admin > Staff
2. Update the admin user's password
3. Optionally create additional staff accounts

---

## Step 6: Add Products

### Option A: One by one (Admin > Products)
1. Click "Add product"
2. Fill in name, category, price, stock
3. For image: paste any URL (Unsplash page URLs work! e.g., `https://unsplash.com/photos/green-emoji-standee--T-9-x7ypCI`)
4. The system auto-converts Unsplash page URLs to direct image URLs

### Option B: Bulk upload (Admin > Products > Spreadsheet)
1. Download the template spreadsheet
2. Fill in product data (columns: name, category, price, discountPrice, stock, unit, image, description)
3. Upload the filled spreadsheet

### Image URL tips:
- **Unsplash**: Just paste the page URL (e.g., `https://unsplash.com/photos/...`) - auto-converted!
- **Direct URLs**: Use `https://images.unsplash.com/photo-xxx?w=800&fit=crop`
- **Imgur**: Use the direct link (e.g., `https://i.imgur.com/abc123.jpg`)
- **Any HTTPS URL**: Any publicly accessible image URL works

---

## Step 7: Custom Domain (Optional)

1. Customer purchases a domain (e.g., `lakshmisupermarket.in`)
2. In Vercel > Project > Settings > Domains > Add domain
3. Update DNS:
   - Add CNAME record: `www` → `cname.vercel-dns.com`
   - Add A record: `@` → `76.76.21.21`
4. Update env vars: `NEXT_PUBLIC_SITE_URL`, `NEXTAUTH_URL`, `AUTH_URL` to new domain
5. Redeploy

---

## Checklist Before Handoff

- [ ] Store name shows correctly on homepage, header, admin
- [ ] Store location pin is accurate on map
- [ ] Delivery radius and pincodes are correct
- [ ] At least 10-20 products added with images
- [ ] Admin password changed from default
- [ ] Logo uploaded or URL set
- [ ] Test order flow works (add to cart → checkout → GPS check → place order)
- [ ] WhatsApp notifications working (if configured)
- [ ] Custom domain configured (if purchased)
- [ ] Customer trained on admin panel usage

---

## Troubleshooting

### "Image not loading"
- Make sure URL starts with `https://`
- For Unsplash, you can paste the page URL directly (e.g., `unsplash.com/photos/...`)
- Check if the image URL is publicly accessible (try opening in incognito)

### "Location outside delivery radius"
- Verify store coordinates in Admin > Settings match the actual shop location
- Check delivery radius is large enough
- Verify serviceable pincodes include customer's area

### "Database connection error"
- Check `DATABASE_URL` is correct
- Ensure the database allows connections from Vercel's IPs
- For Neon: enable "Pooled connection" mode

### "Login not working"
- Verify `NEXTAUTH_SECRET` and `AUTH_SECRET` are set and identical
- Verify `NEXTAUTH_URL` matches the actual deployment URL
- Clear cookies and try again

---

## Monthly Maintenance

- **Hosting cost**: Vercel free tier (up to 100GB bandwidth) or Pro ($20/mo)
- **Database cost**: Neon free tier (0.5 GB) or $19/mo for more
- **Domain cost**: ~₹500-1000/year
- **Total**: ₹0-2000/month depending on traffic

---

## Architecture Overview

```
Customer's Phone/Browser
         │
         ▼
   Vercel (Next.js)  ←── Static assets, SSR pages
         │
         ▼
   PostgreSQL (Neon/Supabase)  ←── Products, orders, users, settings
         │
         ▼
   Cloudflare R2 (optional)  ←── Product images, logos
         │
         ▼
   WhatsApp API (optional)  ←── Order notifications
```

All store configuration (name, address, coordinates, delivery rules) is stored in the database `Setting` table and can be changed anytime from the Admin panel without redeploying.
