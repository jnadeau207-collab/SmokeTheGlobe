"use client";
import {{ signOut }} from "next-auth/react";
import React from "react";

const SignOutButton: React.FC = () => {
  return (
    <button
      onClick={() => signOut()}
      className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300 hover:border-emerald-500 hover:text-emerald-400"
    >
      Sign out
    </button>
  );
};

export default SignOutButton;
