"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Option = { id: string; name: string };

const STATUSES = ["ACTIVE", "DRAFT", "ARCHIVED"] as const;

export function ProductsFilterBar({
  categories,
  brands,
}: {
  categories: Option[];
  brands: Option[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [, startTransition] = React.useTransition();

  const q = sp.get("q") ?? "";
  const categoryId = sp.get("categoryId") ?? "all";
  const brandId = sp.get("brandId") ?? "all";
  const status = sp.get("status") ?? "all";

  const [draftQ, setDraftQ] = React.useState(q);
  React.useEffect(() => setDraftQ(q), [q]);

  const hasFilters = Boolean(
    q ||
      categoryId !== "all" ||
      brandId !== "all" ||
      status !== "all",
  );

  function update(patch: Record<string, string | null>) {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v == null || v === "" || v === "all") next.delete(k);
      else next.set(k, v);
    }
    const query = next.toString();
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname);
    });
  }

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    update({ q: draftQ.trim() });
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <form onSubmit={onSearchSubmit} className="flex-1 min-w-[200px]">
        <Input
          name="q"
          value={draftQ}
          onChange={(e) => setDraftQ(e.target.value)}
          placeholder="Search title or slug..."
          aria-label="Search products"
        />
      </form>

      <Select
        value={categoryId}
        onValueChange={(v) => update({ categoryId: v })}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={brandId} onValueChange={(v) => update({ brandId: v })}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Brand" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All brands</SelectItem>
          {brands.map((b) => (
            <SelectItem key={b.id} value={b.id}>
              {b.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={status} onValueChange={(v) => update({ status: v })}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() =>
            update({ q: null, categoryId: null, brandId: null, status: null })
          }
        >
          <X className="mr-1 h-4 w-4" />
          Clear
        </Button>
      ) : null}
    </div>
  );
}
