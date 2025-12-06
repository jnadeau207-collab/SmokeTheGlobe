// src/app/layout.tsx
import "../styles/globals.css";
import type { ReactNode } from "react";
import Providers from "./providers";

export const metadata = {
  title: "Smoke The Globe",
  description:
    "Global cannabis transparency – licenses, lab results, and seed-to-sale oversight.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full bg-slate-950">
      <body className="min-h-screen bg-slate-950 text-slate-50 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
