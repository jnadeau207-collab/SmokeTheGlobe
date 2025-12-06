// src/pages/api/public/search.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

type SearchResult = {
  id: string;
  licenseNumber: string;
  entityName: string;
  countryCode: string;
  regionCode: string | null;
  city: string | null;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { q, country, region } = req.query;

  const query = typeof q === "string" ? q.trim() : "";
  const countryCode =
    typeof country === "string" ? country.trim().toUpperCase() : undefined;
  const regionCode =
    typeof region === "string" ? region.trim().toUpperCase() : undefined;

  try {
    const where: any = {};

    if (query.length > 0) {
      where.OR = [
        { entityName: { contains: query, mode: "insensitive" } },
        { licenseNumber: { contains: query, mode: "insensitive" } },
        { city: { contains: query, mode: "insensitive" } },
      ];
    }

    if (countryCode) {
      where.countryCode = countryCode;
    }

    if (regionCode) {
      where.regionCode = regionCode;
    }

    const results = await prisma.stateLicense.findMany({
      where,
      orderBy: [{ countryCode: "asc" }, { regionCode: "asc" }, { entityName: "asc" }],
      take: 50,
      select: {
        id: true,
        licenseNumber: true,
        entityName: true,
        countryCode: true,
        regionCode: true,
        city: true,
      },
    });

    const payload: SearchResult[] = results.map((r) => ({
      id: r.id,
      licenseNumber: r.licenseNumber,
      entityName: r.entityName,
      countryCode: r.countryCode,
      regionCode: r.regionCode,
      city: r.city,
    }));

    return res.status(200).json({ results: payload });
  } catch (error: any) {
    console.error("Error in /api/public/search", error);
    return res.status(500).json({ error: "Search failed" });
  }
}
