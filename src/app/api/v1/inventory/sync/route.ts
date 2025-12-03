// src/app/api/v1/inventory/sync/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { Database } from '../../../../../../lib/database.types';
import {
  InventorySyncPayloadSchema,
  InventorySyncPayload
} from '../../schemas';
import {
  requireAuthWithRole,
  assertLicenseOwnership
} from '../../auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuthWithRole(['business_owner']);

    const json = await req.json();
    const parsed = InventorySyncPayloadSchema.parse(json) as InventorySyncPayload;

    const licenseRow = await assertLicenseOwnership(parsed.license_number, userId);

    const cookieStore = cookies();
    const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore });

    const { id: licenseId } = licenseRow;

    const batchRows = parsed.items.map(item => ({
      license_id: licenseId,
      owner_user_id: userId,
      batch_number: item.batch_number,
      external_id: null,
      strain_name: item.strain_name ?? null,
      quantity: item.quantity,
      uom: item.uom,
      status: item.status ?? null
    }));

    const inventoryRows = parsed.items.map(item => ({
      license_id: licenseId,
      owner_user_id: userId,
      batch_id: null,
      sku: item.metadata?.sku ?? null,
      product_name: item.metadata?.product_name ?? null,
      quantity_on_hand: item.quantity,
      uom: item.uom,
      location: item.metadata?.location ?? null,
      status: item.status ?? null
    }));

    const { error: batchError } = await supabase
      .from('batches')
      .insert(batchRows);

    if (batchError) {
      console.error(batchError);
      return NextResponse.json({ error: 'Failed to insert batches' }, { status: 500 });
    }

    const { error: invError } = await supabase
      .from('inventory')
      .insert(inventoryRows);

    if (invError) {
      console.error(invError);
      return NextResponse.json({ error: 'Failed to insert inventory rows' }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid payload', details: err.flatten() },
        { status: 400 }
      );
    }

    const status = typeof err?.status === 'number' ? err.status : 500;
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status });
  }
}


