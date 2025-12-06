// src/pages/api/admin/etl/cannlytics-licenses.ts
//
// Admin / cron endpoint to trigger the Cannlytics licenses ETL.
//
// Auth options:
//  - Cron-style: provide ?secret=CRON_SECRET or header `x-cron-secret`
//  - (Future) Session-based admin auth if you want a UI button.
//

import type { NextApiRequest, NextApiResponse } from "next";
import { runCannlyticsLicensesEtl } from "@/lib/etl/cannlyticsLicenses";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const secret =
    (req.query.secret as string | undefined) ||
    (req.headers["x-cron-secret"] as string | undefined);

  if (!secret || secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
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
