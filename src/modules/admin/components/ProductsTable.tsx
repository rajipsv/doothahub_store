"use client";

import * as React from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Archive, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  archiveProductAction,
  deleteProductAction,
  togglePickupEligibleAction,
} from "@/modules/admin/actions/products";
import { formatMoney } from "@/lib/utils";

type Row = {
  id: string;
  title: string;
  slug: string;
  status: string;
  category: string;
  brand: string;
  priceCents: number;
  inventory: number;
  pickupEligible: boolean;
};

const col = createColumnHelper<Row>();

function PickupToggle({
  id,
  pickupEligible,
}: {
  id: string;
  pickupEligible: boolean;
}) {
  return (
    <form action={togglePickupEligibleAction}>
      <input type="hidden" name="id" value={id} />
      <input
        type="hidden"
        name="pickupEligible"
        value={pickupEligible ? "false" : "true"}
      />
      <Button type="submit" variant={pickupEligible ? "default" : "outline"} size="sm">
        {pickupEligible ? "Pickup on" : "Pickup off"}
      </Button>
    </form>
  );
}

function RowActions({ id, title }: { id: string; title: string }) {
  function confirmDelete(e: React.FormEvent<HTMLFormElement>) {
    const ok = window.confirm(
      `Delete "${title}"? This hides it from the store and from this list. Order history is preserved. You can recover it from the database if needed.`,
    );
    if (!ok) e.preventDefault();
  }

  return (
    <div className="flex justify-end gap-2">
      <form action={archiveProductAction}>
        <input type="hidden" name="id" value={id} />
        <Button
          type="submit"
          variant="outline"
          size="sm"
          title="Archive (hide from storefront, keep in list)"
        >
          <Archive className="mr-1 h-4 w-4" />
          Archive
        </Button>
      </form>
      <form action={deleteProductAction} onSubmit={confirmDelete}>
        <input type="hidden" name="id" value={id} />
        <Button
          type="submit"
          variant="destructive"
          size="sm"
          title="Delete (soft-delete; removes from list)"
        >
          <Trash2 className="mr-1 h-4 w-4" />
          Delete
        </Button>
      </form>
    </div>
  );
}

const columns = [
  col.accessor("title", { header: "Title" }),
  col.accessor("category", { header: "Category" }),
  col.accessor("brand", { header: "Brand" }),
  col.accessor("slug", { header: "Slug" }),
  col.accessor("status", {
    header: "Status",
    cell: (info) => (
      <Badge variant={info.getValue() === "ACTIVE" ? "success" : "secondary"}>
        {info.getValue()}
      </Badge>
    ),
  }),
  col.accessor("pickupEligible", {
    header: "Pickup",
    cell: (info) => (
      <PickupToggle
        id={info.row.original.id}
        pickupEligible={info.getValue()}
      />
    ),
  }),
  col.accessor("priceCents", {
    header: "Price",
    cell: (info) => formatMoney(info.getValue()),
  }),
  col.accessor("inventory", { header: "Inventory" }),
  col.display({
    id: "actions",
    header: "Actions",
    cell: (info) => (
      <RowActions id={info.row.original.id} title={info.row.original.title} />
    ),
  }),
];

export function ProductsTable({ data }: { data: Row[] }) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (data.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        No products yet. Click <strong>New product</strong> above to add your
        first one.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((h) => (
                <TableHead
                  key={h.id}
                  className={h.id === "actions" ? "text-right" : undefined}
                >
                  {flexRender(h.column.columnDef.header, h.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
