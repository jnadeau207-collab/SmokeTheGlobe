// src/pages/api/admin/etl/cannlytics-licenses.ts
//
// Admin / cron endpoint to trigger the Cannlytics licenses ETL.
//
// Auth options:
//  - Cron-style: provide ?secret=CRON_SECRET or header `x-cron-secret`.
//  - Session-style: be logged in as an admin user (role: "admin").
//
// This keeps local dev easy while allowing you to wire a cron job
// in production with only the shared secret.

import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { runCannlyticsLicensesEtl } from "@/lib/etl/cannlyticsLicenses";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const querySecret =
    typeof req.query.secret === "string" ? req.query.secret : undefined;
  const headerSecret =
    typeof req.headers["x-cron-secret"] === "string"
      ? (req.headers["x-cron-secret"] as string)
      : undefined;

  const envSecret = process.env.CRON_SECRET;

  let authorized = false;

  if (
    envSecret &&
    (querySecret === envSecret || headerSecret === envSecret)
  ) {
    authorized = true;
  } else {
    // Fall back to session-based auth: only admins may run ETL.
    const session = await getServerSession(req, res, authOptions);
    const role = (session?.user as any)?.role;
    if (session && (role === "admin" || role === "superadmin")) {
      authorized = true;
    }
  }

  if (!authorized) {
    return res.status(401).json({
      ok: false,
      error:
        "Unauthorized. Provide ?secret=CRON_SECRET or be logged in as an admin.",
    });
  }

  const limitParam = req.query.limit as string | undefined;
  const dryRunParam = req.query.dryRun as string | undefined;

  const limit = limitParam ? Number(limitParam) : undefined;
  const dryRun = dryRunParam === "1" || dryRunParam === "true";

  try {
    const result = await runCannlyticsLicensesEtl({ limit, dryRun });

    return res.status(200).json({
      ok: true,
      dryRun,
      ...result,
    });
  } catch (err: any) {
    console.error("[ETL] Cannlytics licenses ETL failed:", err);
    return res.status(500).json({
      ok: false,
      error: err?.message || "ETL failed",
    });
  }
}
