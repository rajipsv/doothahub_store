"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type Row = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
  orders: number;
};

export function CustomersTable({ rows }: { rows: Row[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Orders</TableHead>
          <TableHead>Joined</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.id}>
            <TableCell>{r.name ?? "\u2014"}</TableCell>
            <TableCell>{r.email}</TableCell>
            <TableCell>
              <Badge variant="outline">{r.role}</Badge>
            </TableCell>
            <TableCell>{r.orders}</TableCell>
            <TableCell>{new Date(r.createdAt).toLocaleDateString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
