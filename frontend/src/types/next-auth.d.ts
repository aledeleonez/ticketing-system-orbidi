import "next-auth";

declare module "next-auth" {
  interface Session {
    backendToken?: string;
    user: {
      id: number;
      email: string;
      name: string;
      avatar_url?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    backendToken?: string;
    user?: {
      id: number;
      email: string;
      name: string;
      avatar_url?: string | null;
    };
  }
}