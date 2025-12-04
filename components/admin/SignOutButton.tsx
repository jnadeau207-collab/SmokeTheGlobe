// components/admin/SignOutButton.tsx
"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="rounded-full border border-slate-700/80 bg-slate-900/70 px-3 py-1 text-[0.7rem] font-medium text-slate-100 hover:border-emerald-500 hover:text-emerald-300"
    >
      Sign out
    </button>
  );
}
