export {
  getDashboardStats,
  getRevenueSeries,
  listCustomers,
} from "@/modules/admin/services/dashboard";
export {
  createProductAction,
  archiveProductAction,
} from "@/modules/admin/actions/products";
export {
  markShippedAction,
  refundOrderAction,
} from "@/modules/admin/actions/orders";
export { StatsGrid } from "@/modules/admin/components/StatsGrid";
export { RevenueChart } from "@/modules/admin/components/RevenueChart";
export { ProductsTable } from "@/modules/admin/components/ProductsTable";
export { OrdersTable } from "@/modules/admin/components/OrdersTable";
export { CustomersTable } from "@/modules/admin/components/CustomersTable";
export { ProductFormDrawer } from "@/modules/admin/components/ProductFormDrawer";
