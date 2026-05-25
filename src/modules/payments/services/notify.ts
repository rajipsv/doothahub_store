import "server-only";
import { sendEmail } from "@/lib/resend";
import { getOrder } from "@/modules/orders";
import { OrderConfirmationEmail } from "@/emails/order-confirmation";

export async function sendOrderConfirmation(orderId: string) {
  const order = await getOrder(orderId);
  if (!order || !order.email) return;
  await sendEmail({
    to: order.email,
    subject: `Order ${order.orderNumber} confirmed`,
    react: OrderConfirmationEmail({ order }),
  });
}
