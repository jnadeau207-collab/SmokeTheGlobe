// src/pages/api/admin/etl/ny-ocm-licenses.ts
//
// Admin / cron endpoint to trigger the New York OCM licenses ETL.
//
// Auth options (same pattern as Cannlytics ETL):
//  - Cron-style: provide ?secret=CRON_SECRET
//  - Or set header `x-cron-secret: CRON_SECRET`
//
// This route is intended for server-to-server calls (cron, admin tools),
// not for untrusted client access.

import type { NextApiRequest, NextApiResponse } from "next";
import { runNyOcmLicensesEtl } from "@/lib/etl/nyOcmLicenses";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const cronSecret = process.env.CRON_SECRET;
  const providedSecret =
    (req.query.secret as string | undefined) ||
    (req.headers["x-cron-secret"] as string | undefined);

  if (!cronSecret || !providedSecret || providedSecret !== cronSecret) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  const limitParam = req.query.limit;
  const limit =
    typeof limitParam === "string" ? parseInt(limitParam, 10) : undefined;

  const dryRunParam = req.query.dryRun;
  const dryRun =
    dryRunParam === "1" ||
    dryRunParam === "true" ||
    dryRunParam === "yes";

  try {
    const result = await runNyOcmLicensesEtl({
      limit: Number.isFinite(limit as number) ? (limit as number) : undefined,
      dryRun,
    });

    return res.status(200).json({
      ok: true,
      dryRun,
      ...result,
    });
  } catch (err: any) {
    console.error("[ETL] NY OCM licenses ETL failed:", err);
    return res.status(500).json({
      ok: false,
      error: err?.message || "ETL failed",
    });
  }
}
