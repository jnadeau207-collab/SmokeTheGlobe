// src/app/admin/layout.tsx
import type { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import Link from "next/link";
import SignOutButton from "@/components/admin/SignOutButton";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Basic admin gate – only allow role === 'admin'
  const role = (session?.user as any)?.role;
  if (!session || role !== "admin") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gradient-to-bl from-violet-500 to-fuchsia-500 text-white flex">
      {/* Sidebar Navigation */}
      <nav className="w-64 p-6 bg-slate-900/30 backdrop-blur-md shadow-xl shadow-black/20 flex flex-col border-r border-white/10">
        <h2 className="text-lg font-bold mb-4 tracking-tight">Admin Panel</h2>
        <ul className="space-y-1 text-sm">
          <li>
            <Link
              href="/admin"
              className="block px-3 py-2 rounded-md hover:bg-emerald-500/20 hover:text-emerald-200 transition-colors"
            >
              Dashboard
            </Link>
          </li>
          <li>
            <Link
              href="/admin/licenses"
              className="block px-3 py-2 rounded-md hover:bg-emerald-500/20 hover:text-emerald-200 transition-colors"
            >
              Licenses
            </Link>
          </li>
          <li>
            <Link
              href="/admin/batches"
              className="block px-3 py-2 rounded-md hover:bg-emerald-500/20 hover:text-emerald-200 transition-colors"
            >
              Batches
            </Link>
          </li>
          <li>
            <Link
              href="/admin/lab-results"
              className="block px-3 py-2 rounded-md hover:bg-emerald-500/20 hover:text-emerald-200 transition-colors"
            >
              Lab Results
            </Link>
          </li>
          <li>
            <Link
              href="/admin/uploads"
              className="block px-3 py-2 rounded-md hover:bg-emerald-500/20 hover:text-emerald-200 transition-colors"
            >
              COA Uploads
            </Link>
          </li>
          <li>
            <Link
              href="/admin/states"
              className="block px-3 py-2 rounded-md hover:bg-emerald-500/20 hover:text-emerald-200 transition-colors"
            >
              States
            </Link>
          </li>
        </ul>

        <div className="mt-auto pt-6 border-t border-white/10">
          <div className="flex items-center justify-between text-xs text-slate-300/80">
            <span className="truncate">
              {(session.user as any)?.email ?? "admin"}
            </span>
            <SignOutButton />
          </div>
        </div>
      </nav>

      {/* Main content area */}
      <main className="flex-1">
        <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
          {children}
        </div>
      </main>
    </div>
  );
}
