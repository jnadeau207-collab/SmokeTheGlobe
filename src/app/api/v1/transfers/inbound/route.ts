// src/app/api/v1/transfers/inbound/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { Database } from '../../../../../../lib/database.types';
import {
  TransferInboundPayloadSchema,
  TransferInboundPayload
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
    const parsed = TransferInboundPayloadSchema.parse(json) as TransferInboundPayload;

    const licenseRow = await assertLicenseOwnership(parsed.license_number, userId);
    const { id: licenseId } = licenseRow;

    const cookieStore = cookies();
    const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore });

    const { error: transferError, data: transferResult } = await supabase
      .from('transfers')
      .insert({
        license_id: licenseId,
        owner_user_id: userId,
        manifest_number: parsed.manifest_number,
        external_id: null,
        origin_license_number: parsed.origin_license_number,
        destination_license_number: parsed.license_number,
        status: 'received',
        shipped_at: null,
        received_at: new Date().toISOString(),
        transport_metadata: parsed.transport_metadata ?? {}
      })
      .select('id')
      .single();

    if (transferError || !transferResult) {
      console.error(transferError);
      return NextResponse.json({ error: 'Failed to insert transfer' }, { status: 500 });
    }

    const transferId = transferResult.id;

    const inventoryRows = parsed.lines.map(line => ({
      license_id: licenseId,
      owner_user_id: userId,
      batch_id: null,
      sku: line.sku ?? null,
      product_name: line.product_name ?? null,
      quantity_on_hand: line.quantity,
      uom: line.uom,
      location: 'Inbound Manifest',
      status: 'available'
    }));

    const { error: invError } = await supabase
      .from('inventory')
      .insert(inventoryRows);

    if (invError) {
      console.error(invError);
      return NextResponse.json({ error: 'Failed to update inventory' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, transfer_id: transferId }, { status: 200 });
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


