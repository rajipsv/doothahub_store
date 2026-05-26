"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { slugify } from "@/lib/utils";
import type { TaxonomyResult } from "@/modules/admin/actions/taxonomy";

type Row = {
  id: string;
  name: string;
  slug: string;
  productCount: number;
};

export function TaxonomyManager({
  label,
  rows,
  createAction,
  deleteAction,
}: {
  label: string;
  rows: Row[];
  createAction: (fd: FormData) => Promise<TaxonomyResult>;
  deleteAction: (fd: FormData) => Promise<void>;
}) {
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const slugTouchedRef = React.useRef(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();
  const formRef = React.useRef<HTMLFormElement>(null);

  function onNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setName(v);
    if (!slugTouchedRef.current) setSlug(slugify(v));
  }

  function onSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    slugTouchedRef.current = true;
    setSlug(e.target.value);
  }

  async function submit(fd: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await createAction(fd);
      if (res.ok) {
        setName("");
        setSlug("");
        slugTouchedRef.current = false;
        formRef.current?.reset();
      } else {
        setError(res.error);
      }
    });
  }

  function confirmDelete(name: string) {
    return (e: React.FormEvent<HTMLFormElement>) => {
      if (!window.confirm(`Delete "${name}"?`)) e.preventDefault();
    };
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Add {label}
        </h2>
        <form
          ref={formRef}
          action={submit}
          className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        >
          <div className="space-y-1">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              required
              value={name}
              onChange={onNameChange}
              placeholder={`e.g. ${label === "category" ? "Apparel" : "Acme"}`}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              name="slug"
              value={slug}
              onChange={onSlugChange}
              pattern="^[a-z0-9-]+$"
              placeholder="auto-generated"
            />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : `Add ${label}`}
          </Button>
        </form>
        {error ? (
          <p className="mt-2 text-sm text-destructive">{error}</p>
        ) : null}
      </div>

      <div className="rounded-lg border bg-card">
        {rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No {label.toLowerCase()}s yet. Add one above.
          </div>
        ) : (
          <ul className="divide-y">
            {rows.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-3 p-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{r.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    /{r.slug} {"\u2014"} {r.productCount} product
                    {r.productCount === 1 ? "" : "s"}
                  </p>
                </div>
                <form action={deleteAction} onSubmit={confirmDelete(r.name)}>
                  <input type="hidden" name="id" value={r.id} />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    title={
                      r.productCount > 0
                        ? `Used by ${r.productCount} product(s); delete those first`
                        : "Delete"
                    }
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    Delete
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
