import prisma from "./prisma";
import CredentialsProvider from "next-auth/providers/credentials";
import { NextAuthOptions } from "next-auth";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      type: "credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "jagrutbhole@gmail.com",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          throw new Error("No Credentials Provided!!");
        }

        const userCheck = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            password: true,
          },
        });

        if (!userCheck) {
          throw new Error("No user found with the credentials provided!!");
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, userCheck.password);

        if (!isPasswordValid) {
          throw new Error("Invalid Credentials!!");
        }

        const user = {
          id: userCheck.id,
          name: userCheck.name,
          email: userCheck.email,
          role: userCheck.role,
          createdAt: userCheck.createdAt.toISOString(),
        };

        if (user) {
          return user;
        } else {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role = user.role;
        token.createdAt = user.createdAt;
      }

      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.role = token.role;
        session.user.createdAt = token.createdAt;
      }

      return session;
    },
  },
  pages: {
    signIn: "/login",
    signOut: "/logout",
    error: "/error",
  },
  debug: process.env.NODE_ENV === "development",

  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
};

/*
  
*/
