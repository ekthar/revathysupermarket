import { randomInt } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const DEFAULT_EXPIRY_SECONDS = 300;
const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_RATE_LIMIT = 3;

export function normalizeIndianPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  return digits;
}

export function phoneForDisplay(phone: string) {
  const normalized = normalizeIndianPhone(phone);
  return normalized.startsWith("91") ? `+${normalized.slice(0, 2)} ${normalized.slice(2)}` : phone;
}

export function generateOtp() {
  return String(randomInt(100000, 999999));
}

export async function hashOtp(otp: string) {
  return bcrypt.hash(otp, 12);
}

export async function compareOtp(otp: string, hash: string) {
  return bcrypt.compare(otp, hash);
}

export function otpExpirySeconds() {
  return Number(process.env.OTP_EXPIRY_SECONDS ?? DEFAULT_EXPIRY_SECONDS);
}

export function otpMaxAttempts() {
  return Number(process.env.OTP_MAX_ATTEMPTS ?? DEFAULT_MAX_ATTEMPTS);
}

export function otpRateLimitPer10Min() {
  return Number(process.env.OTP_RATE_LIMIT_PER_10MIN ?? DEFAULT_RATE_LIMIT);
}

export async function createOtpToken(phone: string, otp = generateOtp()) {
  const normalizedPhone = normalizeIndianPhone(phone);
  const expiresAt = new Date(Date.now() + otpExpirySeconds() * 1000);
  const user = await prisma.user.findUnique({ where: { phone: normalizedPhone }, select: { id: true } }).catch(() => null);
  const token = await prisma.otpToken.create({
    data: {
      phone: normalizedPhone,
      tokenHash: await hashOtp(otp),
      expiresAt,
      userId: user?.id
    }
  });
  return { token, otp, phone: normalizedPhone, expiresAt };
}

export async function verifyLatestOtp(phone: string, otp: string) {
  const normalizedPhone = normalizeIndianPhone(phone);
  const token = await prisma.otpToken.findFirst({
    where: {
      phone: normalizedPhone,
      usedAt: null,
      expiresAt: { gt: new Date() }
    },
    orderBy: { createdAt: "desc" }
  });

  if (!token) return { ok: false as const, error: "Verification code expired. Please request a new one." };
  if (token.attempts >= otpMaxAttempts()) return { ok: false as const, error: "Too many wrong attempts. Please request a new code." };

  const valid = await compareOtp(otp, token.tokenHash);
  if (!valid) {
    await prisma.otpToken.update({
      where: { id: token.id },
      data: { attempts: { increment: 1 } }
    });
    return { ok: false as const, error: "Verification code is incorrect." };
  }

  await prisma.otpToken.update({
    where: { id: token.id },
    data: { usedAt: new Date() }
  });
  return { ok: true as const, phone: normalizedPhone, token };
}

export async function countRecentOtps(phone: string) {
  const normalizedPhone = normalizeIndianPhone(phone);
  return prisma.otpToken.count({
    where: {
      phone: normalizedPhone,
      createdAt: { gt: new Date(Date.now() - 10 * 60 * 1000) }
    }
  });
}
