import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/server/db";

const isDev = process.env.NODE_ENV === "development";

// Dev-only: sign in as any email with no password — creates the user if needed
async function devSignIn(email: string) {
  let user = await db.user.findUnique({ where: { email } });
  if (!user) {
    const brokerage = await db.brokerage.create({
      data: { name: "Dev Brokerage", owner: { create: { email, name: "Dev User", role: "BROKER" } } },
      include: { owner: true },
    });
    user = brokerage.owner;
    await db.user.update({
      where: { id: user.id },
      data: { brokerageId: brokerage.id },
    });
  }
  return { id: user.id, email: user.email, name: user.name };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  providers: [
    ...(isDev
      ? [
          Credentials({
            id: "dev-credentials",
            name: "Dev Sign-in",
            credentials: { email: { label: "Email", type: "email" } },
            async authorize(credentials) {
              if (!credentials?.email) return null;
              return devSignIn(String(credentials.email));
            },
          }),
        ]
      : [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID!,
            clientSecret: process.env.AUTH_GOOGLE_SECRET!,
          }),
          Resend({
            apiKey: process.env.AUTH_RESEND_KEY!,
            from: process.env.RESEND_FROM_EMAIL ?? "noreply@brokeros.app",
          }),
        ]),
  ],
  session: {
    strategy: isDev ? "jwt" : "database",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify",
  },
});
