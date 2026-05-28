"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { ProductVariant } from "@prisma/client";

type Props = {
  variants: ProductVariant[];
  value: string;
  onChange: (variantId: string) => void;
};

export function VariantPicker({ variants, value, onChange }: Props) {
  const attrKeys = React.useMemo(() => {
    const keys = new Set<string>();
    for (const v of variants) {
      for (const k of Object.keys((v.attributes ?? {}) as Record<string, unknown>)) {
        keys.add(k);
      }
    }
    return Array.from(keys);
  }, [variants]);

  if (variants.length <= 1) {
    const only = variants[0];
    if (!only) return null;
    const attrs = (only.attributes ?? {}) as Record<string, string>;
    const entries = Object.entries(attrs).filter(
      ([, v]) => v && v.toLowerCase() !== "default",
    );
    if (entries.length === 0) return null;
    return (
      <div className="space-y-2">
        {entries.map(([key, val]) => (
          <div key={key}>
            <p className="mb-1 text-sm font-medium capitalize">{key}</p>
            <p className="text-sm text-muted-foreground">{val}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {attrKeys.map((key) => {
        const optionsForKey = Array.from(
          new Set(
            variants
              .map((v) => (v.attributes as Record<string, string>)[key])
              .filter(Boolean),
          ),
        );
        const selected = variants.find((v) => v.id === value);
        const selectedValue = (selected?.attributes as Record<string, string>)?.[
          key
        ];

        return (
          <div key={key}>
            <p className="mb-2 text-sm font-medium capitalize">{key}</p>
            <div className="flex flex-wrap gap-2">
              {optionsForKey.map((opt) => {
                const target = variants.find(
                  (v) =>
                    (v.attributes as Record<string, string>)[key] === opt,
                );
                if (!target) return null;
                const active = opt === selectedValue;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => onChange(target.id)}
                    className={cn(
                      "rounded-md border px-3 py-1.5 text-sm transition-colors",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "hover:bg-accent",
                    )}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
