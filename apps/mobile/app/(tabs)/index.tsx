import { useQuery } from "@tanstack/react-query";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { apiFetch, type ProductCardPayload } from "@/lib/api";
import { ErrorText, LoadingScreen, ProductCard } from "@/components/ProductCard";
import { colors, spacing } from "@/lib/theme";

export default function HomeScreen() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["featured"],
    queryFn: () =>
      apiFetch<{ ok: true; products: ProductCardPayload[] }>(
        "/products?featured=1",
      ),
  });

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorText message={(error as Error).message} />;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Featured</Text>
      <FlatList
        data={data?.products ?? []}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={({ item }) => <ProductCard product={item} />}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  heading: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "700",
    padding: spacing.md,
  },
  list: { paddingBottom: spacing.lg },
});
