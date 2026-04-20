import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Credenciais inválidas");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            plan: true,
            subscription: true,
          },
        });

        if (!user || !user.passwordHash) {
          throw new Error("Usuário não encontrado");
        }

        if (user.status !== "ACTIVE") {
          throw new Error("Conta suspensa ou inativa");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          throw new Error("Senha incorreta");
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          planId: user.planId,
          planSlug: user?.plan?.slug ?? null,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.planId = user.planId;
        token.planSlug = user.planSlug;
      }
      if (trigger === "update" && session) {
        token.name = session?.name ?? token.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.planId = token.planId as string | null;
        session.user.planSlug = token.planSlug as string | null;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      // Log analytics event
      await prisma.analyticsEvent.create({
        data: {
          userId: user.id,
          eventType: "LOGIN",
          eventData: { timestamp: new Date().toISOString() },
        },
      }).catch(() => { });
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
