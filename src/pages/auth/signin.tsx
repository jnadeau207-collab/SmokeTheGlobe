import Head from "next/head";
import { getCsrfToken } from "next-auth/react";

type Props = {
  csrfToken?: string | null;
  callbackUrl?: string;
};

export default function SignIn({ csrfToken, callbackUrl }: Props) {
  return (
    <>
      <Head>
        <title>Sign in — SmokeTheGlobe</title>
      </Head>

      {/* Fixed full-screen wrapper ensures this card is above layout elements */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
        <div
          className="max-w-md w-full rounded-xl border border-slate-800 bg-slate-900/90 p-6 pointer-events-auto"
          style={{ backdropFilter: "blur(6px)" }}
        >
          <h1 className="text-xl font-semibold mb-2 text-slate-50">CartFax Admin</h1>
          <p className="text-sm text-slate-400 mb-4">
            Sign in with your admin credentials to manage batches, lab results, and verification data.
          </p>

          <form method="post" action="/api/auth/callback/credentials" className="space-y-4" aria-label="admin-signin-form">
            <input name="csrfToken" type="hidden" defaultValue={csrfToken ?? ""} />
            {callbackUrl ? <input name="callbackUrl" type="hidden" defaultValue={callbackUrl} /> : null}

            <div>
              <label className="block text-sm font-medium text-slate-300">Email</label>
              <input
                name="email"
                type="text"
                required
                autoComplete="email"
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800/60 px-3 py-2 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 pointer-events-auto"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300">Password</label>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800/60 px-3 py-2 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 pointer-events-auto"
              />
            </div>

            <div>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-md bg-emerald-500 text-slate-950 px-4 py-2 text-sm font-medium hover:bg-emerald-400"
              >
                Sign in
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export async function getServerSideProps(context: any) {
  const csrfToken = await getCsrfToken(context);
  const callbackUrl = (context.query?.callbackUrl as string) || "/";
  return {
    props: { csrfToken: csrfToken ?? null, callbackUrl },
  };
}
