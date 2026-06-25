-- DropIndex (unused: bcrypt hashes cannot be used for direct lookup)
DROP INDEX "MobileRefreshToken_tokenHash_idx";

-- CreateIndex (supports the refresh token candidate query)
CREATE INDEX "MobileRefreshToken_deviceId_revokedAt_expiresAt_idx" ON "MobileRefreshToken"("deviceId", "revokedAt", "expiresAt");
