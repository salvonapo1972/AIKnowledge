
import Credentials from "next-auth/providers/credentials";
import { verify } from "otplib";

export const authConfig = {
  providers: [
    Credentials({
      name: "OTP",
      credentials: {
        code: { label: "Codice OTP", type: "text" },
      },
      async authorize(credentials) {
        const code = credentials?.code as string;
        const secret = process.env.TOTP_SECRET || "";

        const result = await verify({ token: code, secret });

        if (result.valid) {
          return { id: "admin-id", email: process.env.ADMIN_EMAIL };
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/admin/login",
  },
}
