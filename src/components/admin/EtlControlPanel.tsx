// src/components/admin/EtlControlPanel.tsx
"use client";

import { useState, useTransition } from "react";
import type { EtlRunResult } from "@/app/admin/etl/actions";
import {
  runCannlyticsDryRun,
  runCannlyticsFull,
  runNyOcmDryRun,
  runNyOcmFull,
  runMeOcpDryRun,
  runMeOcpFull,
  runCaDccDryRun,
  runCaDccFull,
  runWaLcbDryRun,
  runWaLcbFull,
  runMaCccDryRun,
  runMaCccFull,
  runCoaIngestFromUploadsDryRun,
  runCoaIngestFromUploadsFull,
} from "@/app/admin/etl/actions";

type Runner = () => Promise<EtlRunResult>;

interface EtlCardConfig {
  id: string;
  title: string;
  description: string;
  primaryLabel: string;
  secondaryLabel: string;
  primaryRunner: Runner;
  secondaryRunner: Runner;
}

const cards: EtlCardConfig[] = [
  {
    id: "cannlytics",
    title: "Cannlytics – All States",
    description:
      "HuggingFace-hosted master license dataset from Cannlytics. Good for broad coverage and backfilling.",
    primaryLabel: "Dry Run (200)",
    secondaryLabel: "Full Sync",
    primaryRunner: runCannlyticsDryRun,
    secondaryRunner: runCannlyticsFull,
  },
  {
    id: "ny-ocm",
    title: "New York OCM – Canonical",
    description:
      "NY Office of Cannabis Management canonical license list. Use this to verify and override third‑party data.",
    primaryLabel: "Dry Run (200)",
    secondaryLabel: "Full Sync",
    primaryRunner: runNyOcmDryRun,
    secondaryRunner: runNyOcmFull,
  },
  {
    id: "me-ocp",
    title: "Maine OCP – Canonical",
    description: "Stubbed feed for Maine OCP licenses. Wiring for official CSV/API to come.",
    primaryLabel: "Dry Run",
    secondaryLabel: "Full Sync",
    primaryRunner: runMeOcpDryRun,
    secondaryRunner: runMeOcpFull,
  },
  {
    id: "ca-dcc",
    title: "California DCC – Canonical",
    description: "Stubbed feed for California DCC licenses.",
    primaryLabel: "Dry Run",
    secondaryLabel: "Full Sync",
    primaryRunner: runCaDccDryRun,
    secondaryRunner: runCaDccFull,
  },
  {
    id: "wa-lcb",
    title: "Washington LCB – Canonical",
    description: "Stubbed feed for Washington state Liquor & Cannabis Board licenses.",
    primaryLabel: "Dry Run",
    secondaryLabel: "Full Sync",
    primaryRunner: runWaLcbDryRun,
    secondaryRunner: runWaLcbFull,
  },
  {
    id: "ma-ccc",
    title: "Massachusetts CCC – Canonical",
    description: "Stubbed feed for Massachusetts Cannabis Control Commission licenses.",
    primaryLabel: "Dry Run",
    secondaryLabel: "Full Sync",
    primaryRunner: runMaCccDryRun,
    secondaryRunner: runMaCccFull,
  },
  {
    id: "coa-from-uploads",
    title: "COA Ingestion – Uploaded Documents",
    description:
      "Converts verified uploaded COA PDFs/images into LabResult + CoaDocument records, linked to batches when possible.",
    primaryLabel: "Dry Run (50 docs)",
    secondaryLabel: "Full Run (500 docs)",
    primaryRunner: runCoaIngestFromUploadsDryRun,
    secondaryRunner: runCoaIngestFromUploadsFull,
  },
];

interface CardState {
  isRunning: boolean;
  lastResult?: EtlRunResult;
  lastError?: string;
}

export default function EtlControlPanel() {
  const [cardState, setCardState] = useState<Record<string, CardState>>({});
  const [isPending, startTransition] = useTransition();

  const run = (card: EtlCardConfig, runner: Runner) => {
    startTransition(() => {
      setCardState((prev) => ({
        ...prev,
        [card.id]: { ...prev[card.id], isRunning: true, lastError: undefined },
      }));

      runner()
        .then((res) => {
          setCardState((prev) => ({
            ...prev,
            [card.id]: {
              ...prev[card.id],
              isRunning: false,
              lastResult: res,
            },
          }));
        })
        .catch((err: unknown) => {
          const message =
            err instanceof Error ? err.message : "Unknown error running ETL. See server logs.";
          setCardState((prev) => ({
            ...prev,
            [card.id]: {
              ...prev[card.id],
              isRunning: false,
              lastError: message,
            },
          }));
        });
    });
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
            ETL Control Center
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Run controlled imports from trusted sources without exposing secrets to the browser.
          </p>
        </div>
        {isPending && (
          <div className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
            Running ETL…
          </div>
        )}
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const state = cardState[card.id] ?? { isRunning: false };
          const last = state.lastResult;
          return (
            <section
              key={card.id}
              className="flex flex-col rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900/80 via-slate-950 to-slate-900/80 p-4 shadow-lg shadow-emerald-500/5"
            >
              <div className="flex-1 space-y-2">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
                  {card.title}
                </h2>
                <p className="text-xs text-slate-400">{card.description}</p>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => run(card, card.primaryRunner)}
                  disabled={state.isRunning}
                  className="flex-1 rounded-md border border-emerald-500/50 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-200 hover:bg-emerald-500/20 disabled:cursor-wait disabled:opacity-60"
                >
                  {card.primaryLabel}
                </button>
                <button
                  type="button"
                  onClick={() => run(card, card.secondaryRunner)}
                  disabled={state.isRunning}
                  className="flex-1 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-200 hover:border-emerald-400 hover:text-emerald-200 disabled:cursor-wait disabled:opacity-60"
                >
                  {card.secondaryLabel}
                </button>
              </div>

              <div className="mt-3 rounded-lg bg-slate-900/80 p-3 text-xs text-slate-300">
                {state.lastError && (
                  <p className="text-xs font-medium text-rose-400">
                    Error: <span className="font-mono">{state.lastError}</span>
                  </p>
                )}
                {last && !state.lastError && (
                  <div className="space-y-1">
                    <p className="font-mono text-[11px] text-slate-400">
                      {last.label} — {last.dryRun ? "DRY RUN" : "FULL RUN"}
                    </p>
                    <p>
                      Processed:{" "}
                      <span className="font-mono text-emerald-300">{last.processed}</span>, Upserts:{" "}
                      <span className="font-mono text-emerald-300">{last.upserts}</span>, Skipped:{" "}
                      <span className="font-mono text-amber-300">{last.skipped}</span>
                    </p>
                    {last.notes?.length > 0 && (
                      <ul className="list-disc space-y-0.5 pl-4 text-[11px] text-slate-400">
                        {last.notes.map((note, idx) => (
                          <li key={idx}>{note}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
                {!state.lastError && !last && (
                  <p className="text-[11px] text-slate-500">
                    No runs yet. Kick off a dry run first to inspect effects before syncing.
                  </p>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
