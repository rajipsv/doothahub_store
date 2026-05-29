import { useQuery } from "@tanstack/react-query";
import { FlatList, StyleSheet, View } from "react-native";
import { apiFetch, type ProductCardPayload } from "@/lib/api";
import { ErrorText, LoadingScreen, ProductCard } from "@/components/ProductCard";
import { colors } from "@/lib/theme";

export default function ShopScreen() {
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["products"],
    queryFn: () =>
      apiFetch<{ ok: true; products: ProductCardPayload[] }>("/products"),
  });

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorText message={(error as Error).message} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={data?.products ?? []}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={({ item }) => <ProductCard product={item} />}
        refreshing={isRefetching}
        onRefresh={() => refetch()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
});
