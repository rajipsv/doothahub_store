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
import { slugify } from "@/lib/utils";

type Option = { id: string; name: string };

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
  const [variants, setVariants] = React.useState([
    { sku: "", priceCents: 1999, inventoryQty: 10, attributes: { size: "M" } },
  ]);
  const [uploading, setUploading] = React.useState(false);

  const [title, setTitle] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const slugTouchedRef = React.useRef(false);

  function onTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setTitle(v);
    if (!slugTouchedRef.current) setSlug(slugify(v));
  }

  function onSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    slugTouchedRef.current = true;
    setSlug(e.target.value);
  }

  function resetForm() {
    setImages([]);
    setVariants([
      { sku: "", priceCents: 1999, inventoryQty: 10, attributes: { size: "M" } },
    ]);
    setTitle("");
    setSlug("");
    slugTouchedRef.current = false;
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

          <div>
            <Label htmlFor="brandId">Brand</Label>
            <Select name="brandId">
              <SelectTrigger>
                <SelectValue placeholder="Select brand" />
              </SelectTrigger>
              <SelectContent>
                {brands.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            {variants.map((v, idx) => (
              <div key={idx} className="grid grid-cols-4 gap-2">
                <input
                  placeholder="SKU"
                  className="h-9 rounded-md border bg-background px-2 text-sm"
                  value={v.sku}
                  onChange={(e) => {
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
                    setVariants(next);
                  }}
                />
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setVariants((cur) => [
                  ...cur,
                  { sku: "", priceCents: 1999, inventoryQty: 10, attributes: { size: "M" } },
                ])
              }
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
