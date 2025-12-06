// src/pages/api/admin/etl/cannlytics-licenses.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { runCannlyticsLicensesEtl } from "@/lib/etl/cannlyticsLicenses";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const secret = req.query.secret;
  if (!secret || secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  const limitParam = Array.isArray(req.query.limit)
    ? req.query.limit[0]
    : req.query.limit;
  const limit = limitParam ? parseInt(limitParam, 10) : undefined;

  const dryRunParam = Array.isArray(req.query.dryRun)
    ? req.query.dryRun[0]
    : req.query.dryRun;
  const dryRun =
    dryRunParam === "1" ||
    dryRunParam === "true" ||
    dryRunParam === "yes";

  const statesParam = Array.isArray(req.query.states)
    ? req.query.states[0]
    : req.query.states;
  const states =
    statesParam && typeof statesParam === "string"
      ? statesParam
          .split(",")
          .map((s) => s.trim().toUpperCase())
          .filter(Boolean)
      : undefined;

  try {
    const result = await runCannlyticsLicensesEtl({
      limit,
      dryRun,
      states
    });

    return res.status(200).json(result);
  } catch (err: any) {
    console.error("[etl:cannlytics] Error", err);
    return res
      .status(500)
      .json({ ok: false, error: err?.message ?? "Unknown error" });
  }
}
