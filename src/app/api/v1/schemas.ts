// src/app/api/v1/schemas.ts
import { z } from 'zod';

export const InventoryItemSchema = z.object({
  license_number: z.string().min(1),
  object_type: z.enum(['plant_batch', 'package', 'lot']).default('plant_batch'),
  batch_number: z.string().min(1),
  strain_name: z.string().optional(),
  quantity: z.number().nonnegative(),
  uom: z.string().min(1),
  status: z.string().optional(),
  metadata: z.record(z.unknown()).optional()
});

export const InventorySyncPayloadSchema = z.object({
  license_number: z.string().min(1),
  items: z.array(InventoryItemSchema).min(1)
});

export const TransferLineSchema = z.object({
  batch_number: z.string().min(1),
  quantity: z.number().nonnegative(),
  uom: z.string().min(1),
  product_name: z.string().optional(),
  sku: z.string().optional()
});

export const TransferInboundPayloadSchema = z.object({
  license_number: z.string().min(1),
  manifest_number: z.string().min(1),
  origin_license_number: z.string().min(1),
  transport_metadata: z.record(z.unknown()).optional(),
  lines: z.array(TransferLineSchema).min(1)
});

export type InventorySyncPayload = z.infer<typeof InventorySyncPayloadSchema>;
export type TransferInboundPayload = z.infer<typeof TransferInboundPayloadSchema>;
