// src/components/admin/SignOutButton.tsx
"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="rounded-full border border-slate-700 bg-slate-900/70 px-4 py-1.5 text-xs font-medium text-slate-100 shadow-sm shadow-black/40 transition hover:border-red-400/70 hover:bg-red-500/10 hover:text-red-200"
    >
      Sign out
    </button>
  );
}
