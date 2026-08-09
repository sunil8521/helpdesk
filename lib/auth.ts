import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db/connect";
import { User } from "@/lib/db/models/User";

// NextAuth options for email/password authentication
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required.");
        }

        await connectToDatabase();

        const user = await User.findOne({
          email: credentials.email.toLowerCase().trim(),
        });

        if (!user) {
          throw new Error("No user found with this email address.");
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isValidPassword) {
          throw new Error("Invalid password.");
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.avatarUrl,
          onboardingCompleted: user.onboardingCompleted,
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
    async jwt({ token, user, trigger }) {
      // Initial sign-in: populate token from user
      if (user) {
        token.id = user.id;
        token.onboardingCompleted = (user as any).onboardingCompleted ?? false;
      }

      // When session is updated (e.g. after finishing onboarding), refresh from DB
      if (trigger === "update") {
        await connectToDatabase();
        const freshUser = await User.findById(token.id);
        if (freshUser) {
          token.onboardingCompleted = freshUser.onboardingCompleted;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        (session.user as any).id = token.id;
        (session.user as any).onboardingCompleted =
          token.onboardingCompleted ?? false;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
