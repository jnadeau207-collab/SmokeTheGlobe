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

      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="max-w-md w-full rounded-lg border shadow-sm p-8 bg-gray-50">
          <h1 className="text-xl font-semibold mb-3">Sign in</h1>
          <p className="text-sm text-gray-600 mb-6">
            Sign in with your admin credentials to manage batches, lab results, and verification data.
          </p>

          <form method="post" action="/api/auth/callback/credentials" className="space-y-4">
            <input name="csrfToken" type="hidden" defaultValue={csrfToken ?? ""} />
            {callbackUrl ? (
              <input name="callbackUrl" type="hidden" defaultValue={callbackUrl} />
            ) : null}

            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                name="email"
                type="text"
                required
                className="mt-1 w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                name="password"
                type="password"
                required
                className="mt-1 w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>

            <div>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-md bg-emerald-600 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-700"
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

// Pull csrfToken server-side and forward callbackUrl query param so sign-in returns to where it started
export async function getServerSideProps(context: any) {
  const csrfToken = await getCsrfToken(context);
  const callbackUrl = (context.query?.callbackUrl as string) || "/";

  return {
    props: { csrfToken: csrfToken ?? null, callbackUrl },
  };
}
