import { formatMoney } from "@doothahub/shared";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Link } from "expo-router";
import type { ProductCardPayload } from "@/lib/api";
import { colors, spacing } from "@/lib/theme";

export function ProductCard({ product }: { product: ProductCardPayload }) {
  return (
    <Link href={`/products/${product.slug}`} asChild>
      <Pressable style={styles.card}>
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Text style={styles.placeholderText}>No image</Text>
          </View>
        )}
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={2}>
            {product.title}
          </Text>
          {product.pickupEligible ? (
            <Text style={styles.pickup}>Store pickup</Text>
          ) : null}
          <Text style={styles.price}>{formatMoney(product.priceCents)}</Text>
        </View>
      </Pressable>
    </Link>
  );
}

export function LoadingScreen() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

export function ErrorText({ message }: { message: string }) {
  return <Text style={styles.error}>{message}</Text>;
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    overflow: "hidden",
    margin: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: { width: "100%", height: 140 },
  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.border,
  },
  placeholderText: { color: colors.muted, fontSize: 12 },
  body: { padding: spacing.sm },
  title: { color: colors.text, fontSize: 14, fontWeight: "600" },
  pickup: { color: colors.success, fontSize: 11, marginTop: 4 },
  price: { color: colors.primary, fontSize: 16, fontWeight: "700", marginTop: 6 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
  },
  error: { color: colors.danger, padding: spacing.md },
});
