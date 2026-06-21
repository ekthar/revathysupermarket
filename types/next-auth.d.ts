import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      passwordVersion?: number;
      authVersion?: number;
      permissions?: string[];
      name?: string | null;
      email?: string | null;
      phone?: string | null;
      image?: string | null;
    };
  }
}
