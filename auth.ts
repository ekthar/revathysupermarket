import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import authConfig from "@/auth.config";
import { normalizeIndianPhone, verifyLatestOtp } from "@/lib/otp";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const versions = await prisma.user.findUnique({ where: { id: user.id }, select: { passwordVersion: true, authVersion: true } }).catch(() => null);
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        token.name = user.name;
        token.email = user.email;
        token.phone = (user as { phone?: string | null }).phone ?? null;
        token.passwordVersion = versions?.passwordVersion ?? 0;
        token.authVersion = versions?.authVersion ?? 0;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const user = token.id
          ? await prisma.user.findUnique({
              where: { id: token.id as string },
              select: { passwordVersion: true, authVersion: true, isActive: true, role: true, name: true, email: true, phone: true, staffPermissions: { select: { permission: true } } }
            }).catch(() => null)
          : null;
        const tokenVersion = Number(token.passwordVersion ?? 0);
        const tokenAuthVersion = Number(token.authVersion ?? 0);
        if (!user?.isActive || user.passwordVersion !== tokenVersion || user.authVersion !== tokenAuthVersion) {
          session.user.id = "";
          session.user.role = "INVALID";
          session.user.passwordVersion = tokenVersion;
          return session;
        }
        session.user.id = token.id as string;
        session.user.role = user.role;
        session.user.name = user.name;
        session.user.email = user.email ?? "";
        session.user.phone = user.phone ?? null;
        session.user.passwordVersion = user.passwordVersion;
        session.user.authVersion = user.authVersion;
        session.user.permissions = user.staffPermissions.map((entry) => entry.permission);
      }
      return session;
    }
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: false
    }),
    Credentials({
      id: "staff-credentials",
      name: "Staff email and password",
      credentials: {
        email: {},
        password: {}
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "");
        const password = String(credentials?.password ?? "");
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash || !user.isActive) return null;
        if (user.lockedUntil && user.lockedUntil > new Date()) return null;
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          const failedLoginAttempts = user.failedLoginAttempts + 1;
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts,
              lockedUntil: failedLoginAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null
            }
          });
          if (failedLoginAttempts >= 5) {
            await prisma.auditLog.create({
              data: {
                actorId: user.id,
                actorRole: user.role,
                action: "account_locked",
                targetType: "User",
                targetId: user.id,
                metadata: { reason: "failed_login_attempts" }
              }
            }).catch(() => null);
          }
          return null;
        }
        await prisma.user.update({
          where: { id: user.id },
          data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() }
        });
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          passwordVersion: user.passwordVersion
        };
      }
    }),
    Credentials({
      id: "phone-otp",
      name: "WhatsApp OTP",
      credentials: {
        phone: {},
        otp: {},
        name: {}
      },
      async authorize(credentials) {
        const phone = normalizeIndianPhone(String(credentials?.phone ?? ""));
        const otp = String(credentials?.otp ?? "");
        const name = String(credentials?.name ?? "").trim();
        if (!/^91\d{10}$/.test(phone) || !/^\d{6}$/.test(otp)) return null;

        const verified = await verifyLatestOtp(phone, otp);
        if (!verified.ok) return null;

        const user = await prisma.user.upsert({
          where: { phone },
          create: {
            name: name || null,
            phone,
            phoneVerified: true,
            role: "CUSTOMER",
            isActive: true,
            lastLoginAt: new Date()
          },
          update: {
            name: name || undefined,
            phoneVerified: true,
            isActive: true,
            lastLoginAt: new Date()
          }
        });
        if (!user.isActive) return null;
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          passwordVersion: user.passwordVersion
        };
      }
    })
  ]
});
