// src/pages/auth/signin.tsx
import Head from "next/head";
import { getCsrfToken } from "next-auth/react";

type Props = {
  csrfToken?: string | null;
  callbackUrl?: string;
};

export default function SignIn({ csrfToken, callbackUrl }: Props) {
  const effectiveCallbackUrl = callbackUrl ?? "/";

  return (
    <>
      <Head>
        <title>Sign in — SmokeTheGlobe</title>
      </Head>

      {/* Full-screen textured background */}
      <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-50">
        {/* Ambient glows & radial textures */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 -top-40 h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="absolute -right-40 bottom-[-10rem] h-96 w-96 rounded-full bg-fuchsia-500/15 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.2),transparent_60%),radial-gradient(circle_at_bottom,_rgba(79,70,229,0.14),transparent_60%)] mix-blend-soft-light" />
          <div className="absolute inset-0 opacity-[0.18] [background-image:radial-gradient(#1f2937_1px,transparent_0)] [background-size:24px_24px]" />
        </div>

        {/* Centered auth card */}
        <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
          <div className="grid w-full max-w-4xl gap-8 rounded-3xl border border-emerald-500/20 bg-slate-950/80 p-6 shadow-2xl shadow-emerald-900/40 backdrop-blur-xl sm:grid-cols-[1.1fr_0.9fr] sm:p-10">
            {/* Left: narrative panel */}
            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-emerald-400/80">
                  Smoke The Globe
                </p>
                <h1 className="mt-3 text-2xl font-semibold sm:text-3xl">
                  Admin control room
                </h1>
              </div>
              <p className="text-sm text-slate-400">
                Sign in with your administrative credentials to manage licenses,
                batches, lab results, and global transparency scoring — all in
                one place.
              </p>
              <div className="grid gap-3 text-xs text-slate-300 sm:grid-cols-2">
                <div className="rounded-xl border border-emerald-500/20 bg-slate-900/70 p-3">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span className="font-semibold">Role-aware access</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Admin, operator, regulator, and analyst views are strictly
                    separated and enforced server-side.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                    <span className="font-semibold">Seed‑to‑sale telemetry</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Secure access to batch, lab, and license data across
                    compliant jurisdictions.
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                For security, credentials are never hardcoded in the codebase
                and must be provided via environment variables only.
              </p>
            </div>

            {/* Right: sign-in form */}
            <form
              method="post"
              action="/api/auth/callback/credentials"
              className="space-y-5"
              aria-label="admin-signin-form"
            >
              {/* CSRF and callbackUrl are required for NextAuth safety and redirect behavior */}
              <input
                name="csrfToken"
                type="hidden"
                defaultValue={csrfToken ?? ""}
              />
              {effectiveCallbackUrl ? (
                <input
                  name="callbackUrl"
                  type="hidden"
                  defaultValue={effectiveCallbackUrl}
                />
              ) : null}

              <div className="space-y-1">
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-400">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-50 outline-none ring-emerald-500/30 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-2"
                  placeholder="admin@example.com"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-400">
                  Password
                </label>
                <input
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-50 outline-none ring-emerald-500/30 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-2"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex items-center justify-between gap-3 text-[11px] text-slate-500">
                <span>Admin access only. Do not share credentials.</span>
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-emerald-300">
                  Seed‑to‑sale secure
                </span>
              </div>

              <button
                type="submit"
                className="mt-2 inline-flex w-full items-center justify-center rounded-lg border border-emerald-400/60 bg-emerald-500/90 px-3 py-2 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-900/40 transition hover:-translate-y-0.5 hover:bg-emerald-400"
              >
                Sign in
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export async function getServerSideProps(context: any) {
  const csrfToken = await getCsrfToken(context);
  const callbackUrl = (context.query?.callbackUrl as string) || "/";
  return {
    props: {
      csrfToken: csrfToken ?? null,
      callbackUrl,
    },
  };
}
