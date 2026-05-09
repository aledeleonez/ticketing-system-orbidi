"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Orbidi Ticketing</h1>
          <p className="text-sm text-slate-500 mt-1">
            Inicia sesión para continuar
          </p>
        </div>
        <Button
          onClick={() => signIn("google", { callbackUrl: "/tickets" })}
          className="w-full"
          size="lg"
        >
          Continuar con Google
        </Button>
      </div>
    </div>
  );
}