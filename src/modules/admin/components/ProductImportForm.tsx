"use client";

import * as React from "react";
import { CheckCircle2, AlertCircle, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  importProductsAction,
  type ImportSummary,
} from "@/modules/admin/actions/import-products";

export function ProductImportForm() {
  const [summary, setSummary] = React.useState<ImportSummary | null>(null);
  const [pending, startTransition] = React.useTransition();
  const formRef = React.useRef<HTMLFormElement>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSummary(null);
    startTransition(async () => {
      const res = await importProductsAction(fd);
      setSummary(res);
      if (res.ok && res.errors === 0) formRef.current?.reset();
    });
  }

  return (
    <div className="space-y-6">
      <form
        ref={formRef}
        onSubmit={onSubmit}
        className="rounded-lg border bg-card p-4"
      >
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[240px] space-y-1">
            <label htmlFor="file" className="text-sm font-medium">
              CSV file
            </label>
            <input
              id="file"
              name="file"
              type="file"
              accept=".csv,text/csv"
              required
              className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground hover:file:opacity-90"
            />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="mr-1 h-4 w-4 animate-spin" /> Importing...
              </>
            ) : (
              "Import"
            )}
          </Button>
        </div>
      </form>

      {summary ? <SummaryPanel summary={summary} /> : null}
    </div>
  );
}

function SummaryPanel({ summary }: { summary: ImportSummary }) {
  if (!summary.ok) {
    return (
      <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm">
        <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
        <div>
          <p className="font-semibold text-destructive">Import failed</p>
          <p className="text-muted-foreground">{summary.error}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total rows" value={summary.total} />
        <Stat label="Created" value={summary.created} tone="success" />
        <Stat
          label="Variants added"
          value={summary.variantsAdded}
          tone="success"
        />
        <Stat label="Errors" value={summary.errors} tone="destructive" />
      </div>
      {summary.rows.length > 0 ? (
        <div className="rounded-lg border bg-card">
          <ul className="divide-y text-sm">
            {summary.rows.map((r) => (
              <li key={r.row} className="flex items-start gap-2 p-3">
                <RowIcon status={r.status} />
                <div className="min-w-0">
                  <p>
                    <span className="font-medium">Row {r.row}</span>
                    {r.productSlug ? (
                      <span className="ml-2 text-muted-foreground">
                        /{r.productSlug}
                      </span>
                    ) : null}
                  </p>
                  <p className="text-muted-foreground">{r.message}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "success" | "destructive";
}) {
  const color =
    tone === "success"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "destructive"
        ? "text-destructive"
        : "text-foreground";
  return (
    <div className="rounded-md border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-xl font-semibold ${color}`}>{value}</p>
    </div>
  );
}

function RowIcon({ status }: { status: ImportSummary["rows"][number]["status"] }) {
  if (status === "created" || status === "variant-added") {
    return <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />;
  }
  if (status === "skipped") {
    return <Info className="mt-0.5 h-4 w-4 text-muted-foreground" />;
  }
  return <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />;
}
