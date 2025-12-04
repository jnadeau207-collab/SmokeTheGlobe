"use client";

import { useMemo } from "react";
import type {
  License,
  PositionedLicense,
} from "../store/galaxyStore";
import { computeGalaxyLayout } from "../store/galaxyStore";

/**
 * Local layout hook – computes positions for the given licenses.
 */
export function useGalaxyLayout(
  licenses: License[]
): PositionedLicense[] {
  return useMemo(
    () => computeGalaxyLayout(licenses),
    [licenses]
  );
}
