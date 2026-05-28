import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { PaymentMethod } from "@prisma/client";
import type { OrderWithItems } from "@/modules/orders";

export function OrderConfirmationEmail({ order }: { order: OrderWithItems }) {
  const fmt = (cents: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: order.currency,
    }).format(cents / 100);

  return (
    <Html>
      <Head />
      <Preview>Your DoothaHub order {order.orderNumber} is confirmed</Preview>
      <Body
        style={{
          backgroundColor: "#f6f6f6",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <Container style={{ background: "#fff", padding: "24px", maxWidth: "560px" }}>
          <Heading as="h1" style={{ fontSize: "20px", margin: 0 }}>
            Thanks for your order!
          </Heading>
          <Text>Order number: <strong>{order.orderNumber}</strong></Text>
          <Hr />
          <Section>
            {order.items.map((it) => (
              <Text key={it.id} style={{ margin: "4px 0" }}>
                {it.quantity} \u00d7 {it.productTitle} ({it.variantSku}) \u2014{" "}
                {fmt(it.totalPriceCents)}
              </Text>
            ))}
          </Section>
          <Hr />
          <Text style={{ margin: "4px 0" }}>Subtotal: {fmt(order.subtotalCents)}</Text>
          <Text style={{ margin: "4px 0" }}>Shipping: {fmt(order.shippingCents)}</Text>
          <Text style={{ margin: "4px 0" }}>Tax: {fmt(order.taxCents)}</Text>
          {order.discountCents > 0 ? (
            <Text style={{ margin: "4px 0" }}>
              Discount: -{fmt(order.discountCents)}
            </Text>
          ) : null}
          <Heading as="h2" style={{ fontSize: "16px" }}>
            Total: {fmt(order.totalCents)}
          </Heading>
          {order.paymentMethod === PaymentMethod.COD ? (
            <Text style={{ marginTop: "12px" }}>
              <strong>Payment:</strong> Cash on delivery — please keep{" "}
              {fmt(order.totalCents)} ready for the delivery person.
            </Text>
          ) : null}
          <Hr />
          <Text style={{ color: "#888", fontSize: "12px" }}>
            We&apos;ll email you again when your order ships.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default OrderConfirmationEmail;
