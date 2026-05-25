"use client";

import * as React from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
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
import { archiveProductAction } from "@/modules/admin/actions/products";
import { formatMoney } from "@/lib/utils";

type Row = {
  id: string;
  title: string;
  slug: string;
  status: string;
  priceCents: number;
  inventory: number;
};

const col = createColumnHelper<Row>();

const columns = [
  col.accessor("title", { header: "Title" }),
  col.accessor("slug", { header: "Slug" }),
  col.accessor("status", {
    header: "Status",
    cell: (info) => (
      <Badge variant={info.getValue() === "ACTIVE" ? "success" : "secondary"}>
        {info.getValue()}
      </Badge>
    ),
  }),
  col.accessor("priceCents", {
    header: "Price",
    cell: (info) => formatMoney(info.getValue()),
  }),
  col.accessor("inventory", { header: "Inventory" }),
  col.display({
    id: "actions",
    header: "",
    cell: (info) => (
      <form action={archiveProductAction}>
        <input type="hidden" name="id" value={info.row.original.id} />
        <Button type="submit" variant="ghost" size="sm">
          Archive
        </Button>
      </form>
    ),
  }),
];

export function ProductsTable({ data }: { data: Row[] }) {
  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });
  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((hg) => (
          <TableRow key={hg.id}>
            {hg.headers.map((h) => (
              <TableHead key={h.id}>
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
  );
}
