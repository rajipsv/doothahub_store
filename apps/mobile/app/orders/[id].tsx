import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { apiFetch } from "@/lib/api";
import { ErrorText, LoadingScreen } from "@/components/ProductCard";
import { colors, spacing } from "@/lib/theme";

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ["order", id],
    queryFn: () =>
      apiFetch<{
        ok: true;
        order: {
          orderNumber: string;
          status: string;
          totalFormatted: string;
          fulfillmentType: string;
          pickupSlotLabel: string | null;
          items: { title: string; quantity: number; lineTotalCents: number }[];
        };
      }>(`/orders/${id}`),
    enabled: Boolean(id),
  });

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorText message={(error as Error).message} />;

  const order = data!.order;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.number}>{order.orderNumber}</Text>
      <Text style={styles.meta}>{order.status}</Text>
      <Text style={styles.meta}>{order.fulfillmentType}</Text>
      {order.pickupSlotLabel ? (
        <Text style={styles.meta}>Pickup: {order.pickupSlotLabel}</Text>
      ) : null}
      <Text style={styles.total}>{order.totalFormatted}</Text>
      {order.items.map((it, idx) => (
        <View key={idx} style={styles.line}>
          <Text style={styles.lineTitle}>
            {it.title} × {it.quantity}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, gap: spacing.sm },
  number: { color: colors.text, fontSize: 20, fontWeight: "700" },
  meta: { color: colors.muted },
  total: { color: colors.primary, fontSize: 18, fontWeight: "700", marginVertical: spacing.sm },
  line: { paddingVertical: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.border },
  lineTitle: { color: colors.text },
});
