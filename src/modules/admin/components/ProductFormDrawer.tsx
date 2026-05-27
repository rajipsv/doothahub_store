"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createProductAction } from "@/modules/admin/actions/products";
import { uploadToCloudinary } from "@/modules/admin/lib/upload";
import { buildVariantSku, slugify } from "@/lib/utils";

type Option = { id: string; name: string };

type VariantRow = {
  sku: string;
  priceCents: number;
  inventoryQty: number;
  attributes: { size: string };
};

const DEFAULT_VARIANT: VariantRow = {
  sku: "",
  priceCents: 1999,
  inventoryQty: 10,
  attributes: { size: "M" },
};

function applyAutoSkus(
  productSlug: string,
  rows: VariantRow[],
  skuTouched: boolean[],
): VariantRow[] {
  if (!productSlug.trim()) return rows;

  const seen = new Map<string, number>();
  return rows.map((row, idx) => {
    if (skuTouched[idx]) return row;

    const base = buildVariantSku(productSlug, row.attributes.size ?? "");
    if (!base) return row;

    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    const sku = buildVariantSku(
      productSlug,
      row.attributes.size ?? "",
      count > 0 ? count + 1 : undefined,
    );
    return { ...row, sku };
  });
}

export function ProductFormDrawer({
  categories,
  brands,
  cloudinary,
}: {
  categories: Option[];
  brands: Option[];
  cloudinary: {
    cloudName?: string | null;
    apiKey?: string | null;
  };
}) {
  const [open, setOpen] = React.useState(false);
  const [images, setImages] = React.useState<{ url: string }[]>([]);
  const [variants, setVariants] = React.useState<VariantRow[]>([
    { ...DEFAULT_VARIANT },
  ]);
  const [uploading, setUploading] = React.useState(false);

  const [title, setTitle] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const slugTouchedRef = React.useRef(false);
  const skuTouchedRef = React.useRef<boolean[]>([false]);

  function syncVariantsSkus(nextSlug: string, rows: VariantRow[]) {
    return applyAutoSkus(nextSlug, rows, skuTouchedRef.current);
  }

  function onTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setTitle(v);
    if (!slugTouchedRef.current) {
      const nextSlug = slugify(v);
      setSlug(nextSlug);
      setVariants((prev) => syncVariantsSkus(nextSlug, prev));
    }
  }

  function onSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    slugTouchedRef.current = true;
    const nextSlug = e.target.value;
    setSlug(nextSlug);
    setVariants((prev) => syncVariantsSkus(nextSlug, prev));
  }

  function resetForm() {
    setImages([]);
    setVariants([{ ...DEFAULT_VARIANT }]);
    setTitle("");
    setSlug("");
    slugTouchedRef.current = false;
    skuTouchedRef.current = [false];
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!cloudinary.cloudName || !cloudinary.apiKey) {
      alert("Cloudinary not configured");
      return;
    }
    setUploading(true);
    try {
      const res = await fetch("/api/cloudinary/sign", { method: "POST" });
      const signed = await res.json();
      const url = await uploadToCloudinary(file, signed);
      setImages((cur) => [...cur, { url }]);
    } finally {
      setUploading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>New product</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create product</DialogTitle>
        </DialogHeader>

        <form
          action={async (fd) => {
            fd.set("imagesJson", JSON.stringify(images));
            fd.set("variantsJson", JSON.stringify(variants));
            const res = await createProductAction(fd);
            if (res.ok) {
              setOpen(false);
              resetForm();
            } else {
              alert(res.error ?? "Failed");
            }
          }}
          className="grid gap-3 sm:grid-cols-2"
        >
          <div className="space-y-1">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              required
              value={title}
              onChange={onTitleChange}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              name="slug"
              required
              value={slug}
              onChange={onSlugChange}
              pattern="^[a-z0-9-]+$"
              title="Lowercase letters, numbers, and hyphens only"
            />
            <p className="text-xs text-muted-foreground">
              Auto-filled from title. Edit to override.
            </p>
          </div>
          <FormField name="shortDescription" label="Short description" className="sm:col-span-2" />
          <div className="sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              name="description"
              required
              className="min-h-[120px] w-full rounded-md border border-input bg-background p-3 text-sm"
            />
          </div>

          <div>
            <Label htmlFor="categoryId">Category</Label>
            <Select name="categoryId">
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="brand">Brand (optional)</Label>
            <Input
              id="brand"
              name="brand"
              list="brand-suggestions"
              placeholder="Pick existing or type a new brand"
              autoComplete="off"
            />
            <datalist id="brand-suggestions">
              {brands.map((b) => (
                <option key={b.id} value={b.name} />
              ))}
            </datalist>
            <p className="text-xs text-muted-foreground">
              Start typing to see suggestions. New brands are created automatically.
            </p>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select name="status" defaultValue="DRAFT">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-2 space-y-2 rounded-md border p-3">
            <p className="text-sm font-semibold">Images</p>
            <input type="file" accept="image/*" onChange={onFile} disabled={uploading} />
            <div className="flex flex-wrap gap-2">
              {images.map((img, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={img.url}
                  alt="Uploaded preview"
                  className="h-16 w-16 rounded object-cover"
                />
              ))}
            </div>
          </div>

          <div className="sm:col-span-2 space-y-3 rounded-md border p-3">
            <p className="text-sm font-semibold">Variants</p>
            <p className="text-xs text-muted-foreground">
              SKU auto-fills from slug + size. Edit SKU to override.
            </p>
            {variants.map((v, idx) => (
              <div key={idx} className="grid grid-cols-4 gap-2">
                <input
                  placeholder="Size"
                  className="h-9 rounded-md border bg-background px-2 text-sm"
                  value={v.attributes.size}
                  onChange={(e) => {
                    const next = [...variants];
                    next[idx] = {
                      ...v,
                      attributes: { ...v.attributes, size: e.target.value },
                    };
                    setVariants(syncVariantsSkus(slug, next));
                  }}
                />
                <input
                  placeholder="SKU"
                  className="h-9 rounded-md border bg-background px-2 text-sm"
                  value={v.sku}
                  onChange={(e) => {
                    const touched = [...skuTouchedRef.current];
                    while (touched.length <= idx) touched.push(false);
                    touched[idx] = true;
                    skuTouchedRef.current = touched;
                    const next = [...variants];
                    next[idx] = { ...v, sku: e.target.value };
                    setVariants(next);
                  }}
                />
                <input
                  type="number"
                  placeholder="Price (cents)"
                  className="h-9 rounded-md border bg-background px-2 text-sm"
                  value={v.priceCents}
                  onChange={(e) => {
                    const next = [...variants];
                    next[idx] = { ...v, priceCents: Number(e.target.value) };
                    setVariants(next);
                  }}
                />
                <input
                  type="number"
                  placeholder="Inventory"
                  className="h-9 rounded-md border bg-background px-2 text-sm"
                  value={v.inventoryQty}
                  onChange={(e) => {
                    const next = [...variants];
                    next[idx] = { ...v, inventoryQty: Number(e.target.value) };
                    setVariants(next);
                  }}
                />
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                skuTouchedRef.current = [...skuTouchedRef.current, false];
                setVariants((cur) => {
                  const next = [
                    ...cur,
                    {
                      ...DEFAULT_VARIANT,
                      attributes: { size: "L" },
                    },
                  ];
                  return syncVariantsSkus(slug, next);
                });
              }}
            >
              Add variant
            </Button>
          </div>

          <div className="sm:col-span-2 flex justify-end">
            <Button type="submit">Save product</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FormField({
  name,
  label,
  required,
  className,
}: {
  name: string;
  label: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={`space-y-1 ${className ?? ""}`}>
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} required={required} />
    </div>
  );
}
