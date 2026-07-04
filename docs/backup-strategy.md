# Database Backup Strategy

## Neon (Postgres) — Built-in

Neon provides automated backups (point-in-time recovery) for all plans:

- **Daily snapshots** retained for 7 days (Free tier) or 30 days (paid)
- **WAL archives** enable PITR to any second within the retention window
- **No manual action needed** for basic DR

To trigger an immediate snapshot from Neon console:
1. Go to **Neon Console > Branches > main > Backups**
2. Click **Create snapshot**

## Manual pg_dump (supplemental)

Use this for off-site or pre-migration backups:

```bash
# Full database dump (exclude --data-only for schema + data)
pg_dump "$DATABASE_URL" --no-owner --no-acl -Fc > backup_$(date +%Y%m%d_%H%M%S).dump

# Restore
pg_restore --no-owner --no-acl -d "$DATABASE_URL" backup_20260704_120000.dump
```

## CI/CD — Pre-deploy dump (optional)

Add this to your deploy pipeline in Vercel for extra safety:

```bash
# In a pre-deploy hook or GitHub Action
pg_dump "$DATABASE_URL" --no-owner --no-acl -Fc | gzip | aws s3 cp - s3://your-bucket/db-backups/$(date +%Y%m%d_%H%M%S).dump.gz
```

## Prisma migration safety

Before running `prisma migrate deploy` on production:

```bash
# 1. Create a backup
pg_dump "$DATABASE_URL" --no-owner --no-acl -Fc > pre-migration-backup.dump

# 2. Dry-run the migration
npx prisma migrate deploy -- --dry-run

# 3. Apply (if dry-run looks correct)
npx prisma migrate deploy
```

## Disaster Recovery

If data loss occurs:
1. **Neon PITR**: Restore from the nearest snapshot in Neon console
2. **Manual dump**: Use pg_restore with the latest dump file
3. **Point-in-time**: Neon can restore to any timestamp within the retention window

## Schedule

| Action | Frequency | Owner |
|--------|-----------|-------|
| Neon snapshot (built-in) | Daily (automatic) | Neon |
| Manual pg_dump to S3 | Weekly | DevOps |
| Pre-migration dump | Before each `migrate deploy` | Developer |
