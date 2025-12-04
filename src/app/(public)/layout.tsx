// src/app/(public)/layout.tsx
import type { ReactNode } from "react";
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* Header and nav can be inserted here if needed */}
      {children}
    </div>
  );
}
