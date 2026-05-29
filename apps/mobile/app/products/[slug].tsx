import { useLocalSearchParams, router } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { formatMoney } from "@doothahub/shared";
import { apiFetch } from "@/lib/api";
import { ErrorText, LoadingScreen } from "@/components/ProductCard";
import { colors, spacing } from "@/lib/theme";

type ProductDetail = {
  id: string;
  slug: string;
  title: string;
  description: string;
  shortDescription: string | null;
  pickupEligible: boolean;
  images: { url: string }[];
  variants: {
    id: string;
    priceCents: number;
    inventoryQty: number;
    attributes: Record<string, string>;
  }[];
};

export default function ProductDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["product", slug],
    queryFn: () =>
      apiFetch<{ ok: true; product: ProductDetail }>(`/products/${slug}`),
    enabled: Boolean(slug),
  });

  const addToCart = useMutation({
    mutationFn: (variantId: string) =>
      apiFetch("/cart/items", {
        method: "POST",
        body: { variantId, quantity: 1 },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      router.push("/cart");
    },
  });

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorText message={(error as Error).message} />;

  const product = data!.product;
  const variant = product.variants[0];
  const image = product.images[0]?.url;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {image ? (
        <Image source={{ uri: image }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePh]} />
      )}
      <Text style={styles.title}>{product.title}</Text>
      {product.pickupEligible ? (
        <Text style={styles.pickup}>Store pickup available</Text>
      ) : null}
      {variant ? (
        <Text style={styles.price}>{formatMoney(variant.priceCents)}</Text>
      ) : null}
      <Text style={styles.desc}>{product.shortDescription ?? product.description}</Text>
      {variant ? (
        <Pressable
          style={styles.btn}
          disabled={addToCart.isPending || variant.inventoryQty <= 0}
          onPress={() => addToCart.mutate(variant.id)}
        >
          <Text style={styles.btnText}>
            {variant.inventoryQty <= 0 ? "Out of stock" : "Add to cart"}
          </Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, gap: spacing.sm },
  image: { width: "100%", height: 260, borderRadius: 12 },
  imagePh: { backgroundColor: colors.border },
  title: { color: colors.text, fontSize: 22, fontWeight: "700" },
  pickup: { color: colors.success },
  price: { color: colors.primary, fontSize: 20, fontWeight: "700" },
  desc: { color: colors.muted, lineHeight: 22 },
  btn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 10,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
