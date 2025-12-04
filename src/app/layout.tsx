// src/app/layout.tsx
import "../styles/globals.css";
import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

export const metadata = {
  title: "SmokeTheGlobe",
  description: "Global cannabis transparency platform",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full bg-slate-950">
      <body className="min-h-screen bg-slate-950 text-slate-50 antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
