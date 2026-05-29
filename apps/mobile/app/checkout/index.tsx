import { useEffect, useState } from "react";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { formatMoney } from "@doothahub/shared";
import { useAuth } from "@/context/auth-context";
import { apiFetch } from "@/lib/api";
import { openRazorpayCheckout } from "@/lib/razorpay-checkout";
import { ErrorText, LoadingScreen } from "@/components/ProductCard";
import { colors, spacing } from "@/lib/theme";

type CheckoutSummary = {
  cart: { totalCents: number; split: { isMixed: boolean; hasPickupLines: boolean } };
  config: {
    codEnabled: boolean;
    pickupEnabled: boolean;
    razorpayConfigured: boolean;
    pickupLocationName: string;
  };
  pickupSlots: { id: string; label: string }[];
};

export default function CheckoutScreen() {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [line1, setLine1] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [fulfillmentType, setFulfillmentType] = useState<"DELIVERY" | "PICKUP">("DELIVERY");
  const [pickupSlotId, setPickupSlotId] = useState("");
  const [payment, setPayment] = useState<"online" | "cod">("online");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user?.email && !email) setEmail(user.email);
    if (user?.name && !name) setName(user.name);
  }, [user?.email, user?.name, email, name]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["checkout-summary"],
    queryFn: () => apiFetch<{ ok: true } & CheckoutSummary>("/checkout/summary"),
  });

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorText message={(error as Error).message} />;

  const summary = data!;
  const needsAddress =
    summary.cart.split.hasPickupLines && fulfillmentType === "DELIVERY"
      ? true
      : !summary.cart.split.hasPickupLines || fulfillmentType === "DELIVERY";

  async function placeOrder() {
    setBusy(true);
    try {
      if (payment === "cod") {
        const res = await apiFetch<{ ok: true; orderNumbers: string[] }>(
          "/checkout/cod",
          {
            method: "POST",
            body: {
              email,
              name,
              phone,
              fulfillmentType,
              pickupSlotId: pickupSlotId || undefined,
              line1: needsAddress ? line1 : undefined,
              city: needsAddress ? city : undefined,
              region: needsAddress ? region : undefined,
              postalCode: needsAddress ? postalCode : undefined,
              country: "IN",
            },
          },
        );
        Alert.alert("Order placed", res.orderNumbers.join(", "));
        router.replace("/orders");
        return;
      }

      await openRazorpayCheckout({
        email,
        name,
        phone,
        fulfillmentType,
        pickupSlotId: pickupSlotId || undefined,
      });
      router.replace("/orders");
    } catch (e) {
      Alert.alert("Checkout failed", (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.total}>
        Total {formatMoney(summary.cart.totalCents)}
      </Text>

      <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <Field label="Name" value={name} onChangeText={setName} />
      <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

      {summary.config.pickupEnabled && summary.cart.split.hasPickupLines ? (
        <View style={styles.row}>
          <Chip
            label="Delivery"
            active={fulfillmentType === "DELIVERY"}
            onPress={() => setFulfillmentType("DELIVERY")}
          />
          <Chip
            label="Pickup"
            active={fulfillmentType === "PICKUP"}
            onPress={() => setFulfillmentType("PICKUP")}
          />
        </View>
      ) : null}

      {fulfillmentType === "PICKUP" && summary.pickupSlots.length > 0 ? (
        <View style={styles.slots}>
          <Text style={styles.section}>Pickup at {summary.config.pickupLocationName}</Text>
          {summary.pickupSlots.map((slot) => (
            <Pressable key={slot.id} onPress={() => setPickupSlotId(slot.id)}>
              <Text
                style={[
                  styles.slot,
                  pickupSlotId === slot.id && styles.slotActive,
                ]}
              >
                {slot.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {needsAddress && fulfillmentType === "DELIVERY" ? (
        <>
          <Field label="Address" value={line1} onChangeText={setLine1} />
          <Field label="City" value={city} onChangeText={setCity} />
          <Field label="State" value={region} onChangeText={setRegion} />
          <Field label="PIN" value={postalCode} onChangeText={setPostalCode} keyboardType="number-pad" />
        </>
      ) : null}

      <View style={styles.row}>
        {summary.config.razorpayConfigured ? (
          <Chip label="Pay online" active={payment === "online"} onPress={() => setPayment("online")} />
        ) : null}
        {summary.config.codEnabled ? (
          <Chip label="COD" active={payment === "cod"} onPress={() => setPayment("cod")} />
        ) : null}
      </View>

      <Pressable style={styles.btn} disabled={busy} onPress={placeOrder}>
        <Text style={styles.btnText}>{busy ? "Processing..." : "Place order"}</Text>
      </Pressable>
    </ScrollView>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: "default" | "email-address" | "phone-pad" | "number-pad";
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput
        style={styles.input}
        value={props.value}
        onChangeText={props.onChangeText}
        keyboardType={props.keyboardType}
        autoCapitalize="none"
        placeholderTextColor={colors.muted}
      />
    </View>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, gap: spacing.sm },
  total: { color: colors.text, fontSize: 20, fontWeight: "700", marginBottom: spacing.sm },
  field: { gap: 4 },
  label: { color: colors.muted, fontSize: 13 },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm,
    color: colors.text,
  },
  row: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text },
  chipTextActive: { color: "#fff", fontWeight: "600" },
  section: { color: colors.text, fontWeight: "600" },
  slots: { gap: spacing.xs },
  slot: {
    color: colors.muted,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
  },
  slotActive: { borderColor: colors.primary, color: colors.primary },
  btn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 10,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
