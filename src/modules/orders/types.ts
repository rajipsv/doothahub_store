import type { Order, OrderItem, Address } from "@prisma/client";

export type OrderWithItems = Order & {
  items: OrderItem[];
  shippingAddress: Address | null;
};
