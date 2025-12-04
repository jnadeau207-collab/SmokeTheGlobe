import {{ getServerSession }} from "next-auth";
import {{ authOptions }} from "@/pages/api/auth/[...nextauth]";
import Link from "next/link";
import SignOutButton from "@/components/admin/SignOutButton";
import {{ redirect }} from "next/navigation";

export default async function AdminLayout({{ children }}: {{ children: React.ReactNode }}) {{
  // Server-side session check for admin role
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {{
    redirect("/");
  }}

  return (
    <div className="min-h-screen bg-gradient-to-bl from-violet-500 to-fuchsia-500 text-white flex">
      {/* Sidebar Navigation */}
      <nav className="w-64 p-6 bg-slate-900/30 backdrop-blur-md shadow-xl shadow-black/20 flex flex-col">
        <h2 className="text-lg font-bold mb-4">Admin Menu</h2>
        <ul className="space-y-2">
          <li>
            <Link href="/admin" className="block px-3 py-2 rounded-md hover:bg-emerald-500/20">
              Dashboard
            </Link>
          </li>
          <li>
            <Link href="/admin/licenses" className="block px-3 py-2 rounded-md hover:bg-emerald-500/20">
              Licenses
            </Link>
          </li>
          <li>
            <Link href="/admin/batches" className="block px-3 py-2 rounded-md hover:bg-emerald-500/20">
              Batches
            </Link>
          </li>
          <li>
            <Link href="/admin/lab-results" className="block px-3 py-2 rounded-md hover:bg-emerald-500/20">
              Lab Results
            </Link>
          </li>
          <li>
            <Link href="/admin/uploads" className="block px-3 py-2 rounded-md hover:bg-emerald-500/20">
              COA Uploads
            </Link>
          </li>
          <li>
            <Link href="/admin/states" className="block px-3 py-2 rounded-md hover:bg-emerald-500/20">
              States
            </Link>
          </li>
        </ul>
        <div className="mt-auto pt-6">
          {/* Sign-out button (appears at bottom of sidebar) */}
          <SignOutButton />
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
}}
