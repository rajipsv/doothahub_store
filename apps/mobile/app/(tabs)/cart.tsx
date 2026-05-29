import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, router } from "expo-router";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { formatMoney } from "@doothahub/shared";
import { apiFetch, fetchCart, type CartItemPayload } from "@/lib/api";
import { ErrorText, LoadingScreen } from "@/components/ProductCard";
import { colors, spacing } from "@/lib/theme";

export default function CartScreen() {
  const qc = useQueryClient();
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["cart"],
    queryFn: async () => (await fetchCart()).cart,
  });

  const updateQty = useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      apiFetch(`/cart/items/${id}`, { method: "PATCH", body: { quantity } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/cart/items/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorText message={(error as Error).message} />;

  const cart = data;
  if (!cart || cart.items.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Your cart is empty</Text>
        <Link href="/shop" style={styles.link}>
          Browse products
        </Link>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={cart.items}
        keyExtractor={(item) => item.id}
        refreshing={isRefetching}
        onRefresh={() => refetch()}
        renderItem={({ item }) => (
          <CartLine
            item={item}
            onInc={() => updateQty.mutate({ id: item.id, quantity: item.quantity + 1 })}
            onDec={() => updateQty.mutate({ id: item.id, quantity: item.quantity - 1 })}
            onRemove={() => remove.mutate(item.id)}
          />
        )}
      />
      <View style={styles.footer}>
        <Text style={styles.total}>Total {formatMoney(cart.totalCents)}</Text>
        <Pressable style={styles.checkoutBtn} onPress={() => router.push("/checkout")}>
          <Text style={styles.checkoutText}>Checkout</Text>
        </Pressable>
      </View>
    </View>
  );
}

function CartLine({
  item,
  onInc,
  onDec,
  onRemove,
}: {
  item: CartItemPayload;
  onInc: () => void;
  onDec: () => void;
  onRemove: () => void;
}) {
  return (
    <View style={styles.line}>
      <View style={{ flex: 1 }}>
        <Text style={styles.lineTitle}>{item.title}</Text>
        <Text style={styles.linePrice}>{formatMoney(item.lineTotalCents)}</Text>
      </View>
      <View style={styles.qtyRow}>
        <Pressable onPress={onDec} style={styles.qtyBtn}>
          <Text style={styles.qtyText}>-</Text>
        </Pressable>
        <Text style={styles.qty}>{item.quantity}</Text>
        <Pressable onPress={onInc} style={styles.qtyBtn}>
          <Text style={styles.qtyText}>+</Text>
        </Pressable>
      </View>
      <Pressable onPress={onRemove}>
        <Text style={styles.remove}>Remove</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  emptyText: { color: colors.muted, fontSize: 16 },
  link: { color: colors.primary, marginTop: spacing.md, fontSize: 16 },
  line: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  lineTitle: { color: colors.text, fontWeight: "600" },
  linePrice: { color: colors.primary, marginTop: 4 },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  qtyBtn: {
    backgroundColor: colors.card,
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: { color: colors.text, fontSize: 18 },
  qty: { color: colors.text, minWidth: 24, textAlign: "center" },
  remove: { color: colors.danger, fontSize: 13 },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  total: { color: colors.text, fontSize: 18, fontWeight: "700" },
  checkoutBtn: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 10,
    alignItems: "center",
  },
  checkoutText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
