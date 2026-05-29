import { Link } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { formatMoney } from "@doothahub/shared";
import { apiFetch } from "@/lib/api";
import { ErrorText, LoadingScreen } from "@/components/ProductCard";
import { colors, spacing } from "@/lib/theme";

type OrderRow = {
  id: string;
  orderNumber: string;
  status: string;
  totalCents: number;
  createdAt: string;
};

export default function OrdersScreen() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["orders"],
    queryFn: () => apiFetch<{ ok: true; orders: OrderRow[] }>("/orders"),
  });

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorText message={(error as Error).message} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={data?.orders ?? []}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.empty}>No orders yet</Text>
        }
        renderItem={({ item }) => (
          <Link href={`/orders/${item.id}`} asChild>
            <Pressable style={styles.row}>
              <Text style={styles.number}>{item.orderNumber}</Text>
              <Text style={styles.meta}>
                {item.status} · {formatMoney(item.totalCents)}
              </Text>
            </Pressable>
          </Link>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  empty: { color: colors.muted, textAlign: "center", padding: spacing.lg },
  row: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  number: { color: colors.text, fontWeight: "600" },
  meta: { color: colors.muted, marginTop: 4 },
});
