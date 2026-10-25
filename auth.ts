import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verify } from "otplib";

export const { 
  handlers,      
  auth,          
  signIn,        
  signOut 
} = NextAuth({
  providers: [
    Credentials({
      name: "OTP",
      credentials: {
        code: { label: "Codice OTP", type: "text" },
      },
      async authorize(credentials) {
        const code = credentials?.code as string;
        const secret = process.env.TOTP_SECRET || "";

        if (!code || !secret) return null;

        const isValid = await verify({ token: code, secret });

        if (isValid) {
          return { id: "admin-id", email: process.env.ADMIN_EMAIL };
        }
        
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/admin/login",
  },
  session: {
    strategy: "jwt",
    // 🛡️ SICUREZZA: Scade dopo 15 minuti di inattività (900 secondi)
    // Se l'amministratore dimentica la tab aperta, si disconnetterà da solo.
    maxAge: 1 * 60, 
  },
  cookies: {
    sessionToken: {
      name: `authjs.session-token`, // Nome standard in v5 (usa `__Secure-authjs.session-token` in produzione)
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        // ⚠️ Omettendo 'maxAge' ed 'expires' qui dentro, il cookie diventa tecnicamente "di sessione"
        // e il browser dovrebbe cancellarlo quando viene chiuso del tutto.
      },
    },
  },
  secret: process.env.AUTH_SECRET, 
});
