import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/database";
import { prisma } from "@/lib/prisma";
import { requireAuthWithRole, assertLicenseOwnership } from "@/app/api/v1/auth";
import { InventorySyncPayloadSchema } from "@/app/api/v1/schemas";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
    try {
        // 1. Require authentication with business_owner role (admins allowed via requireAuthWithRole)
        await requireAuthWithRole(["business_owner"]);

        // 2. Parse and validate the request JSON body against InventorySyncPayload schema
        const body = await request.json();
        const data = InventorySyncPayloadSchema.parse(body);

        // 3. Determine the authenticated user's ID (from Supabase or NextAuth session)
        const supabase = createRouteHandlerClient<Database>({ cookies });
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();
        const session = await getServerSession(authOptions);
        const userId = supabaseUser?.id ?? session?.user?.id;
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 4. Verify the user has ownership of the license in the payload
        await assertLicenseOwnership(data.license_number, userId);

        // 5. Look up the StateLicense and associated Location for the given license_number
        const license = await prisma.stateLicense.findFirst({ where: { licenseNumber: data.license_number } });
        if (!license) {
            return NextResponse.json({ error: "License not found" }, { status: 400 });
        }
        const location = await prisma.location.findFirst({ where: { stateLicenseId: license.id } });
        if (!location) {
            return NextResponse.json({ error: "No location for license" }, { status: 500 });
        }

        // 6. Idempotent database upsert logic for Batch and BatchLocation
        const now = new Date();
        // Find existing Batch by batchCode, or create if it doesn't exist
        let batch = await prisma.batch.findFirst({ where: { batchCode: data.batch_number } });
        if (!batch) {
            batch = await prisma.batch.create({ data: { batchCode: data.batch_number, jurisdiction: license.stateCode } });
        }
        // Ensure BatchLocation link exists between this batch and location; update timestamp if it exists
        await prisma.batchLocation.upsert({
            where: { batchId_locationId: { batchId: batch.id, locationId: location.id } },
            update: { lastSeenAt: now },
            create: { batchId: batch.id, locationId: location.id, firstSeenAt: now, lastSeenAt: now }
        });

        // 7. Log success for auditing
        console.log(`Inventory sync succeeded for license ${data.license_number} by user ${userId}`);

        // 8. Respond with success confirmation
        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Inventory sync error:", error);
        // Handle validation errors (bad request)
        if (error instanceof import("zod").ZodError) {
            return NextResponse.json({ error: "Invalid request payload", details: error.issues }, { status: 400 });
        }
        // Handle authorization/ownership errors
        const message = (error as Error).message || String(error);
        if (message.includes("Forbidden")) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        if (message.includes("License not found")) {
            return NextResponse.json({ error: "License not found" }, { status: 400 });
        }
        # Catch-all for other server errors
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
