import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import authConfig from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        token.passwordVersion = (user as { passwordVersion?: number }).passwordVersion ?? 0;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const user = token.id
          ? await prisma.user.findUnique({
              where: { id: token.id as string },
              select: { passwordVersion: true, isActive: true, role: true }
            }).catch(() => null)
          : null;
        const tokenVersion = Number(token.passwordVersion ?? 0);
        if (!user?.isActive || user.passwordVersion !== tokenVersion) {
          session.user.id = "";
          session.user.role = "INVALID";
          session.user.passwordVersion = tokenVersion;
          return session;
        }
        session.user.id = token.id as string;
        session.user.role = user.role;
        session.user.passwordVersion = user.passwordVersion;
      }
      return session;
    }
  },
  providers: [
    Credentials({
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
          role: user.role,
          passwordVersion: user.passwordVersion
        };
      }
    })
  ]
});
