import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {      
      if (account?.id_token) {
        try {
          const res = await fetch(
            `${process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/google`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id_token: account.id_token }),
            }
          );
          if (res.ok) {
            const data = await res.json();
            token.backendToken = data.access_token;
            token.user = data.user;
          }
        } catch (e) {
          console.error("Failed to exchange Google token:", e);
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.backendToken = token.backendToken as string | undefined;
      session.user = token.user as typeof session.user;
      return session;
    },
  },
});