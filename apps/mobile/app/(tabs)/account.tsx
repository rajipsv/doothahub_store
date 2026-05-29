import { Link, router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "@/context/auth-context";
import { colors, spacing } from "@/lib/theme";

export default function AccountScreen() {
  const { user, signOut } = useAuth();

  return (
    <View style={styles.container}>
      {user?.email ? (
        <>
          <Text style={styles.label}>Signed in</Text>
          <Text style={styles.email}>{user.email}</Text>
          <Link href="/orders" asChild>
            <Pressable style={styles.btn}>
              <Text style={styles.btnText}>My orders</Text>
            </Pressable>
          </Link>
          <Pressable
            style={[styles.btn, styles.btnOutline]}
            onPress={async () => {
              await signOut();
            }}
          >
            <Text style={styles.btnTextOutline}>Sign out</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.label}>Welcome to DoothaHub</Text>
          <Pressable style={styles.btn} onPress={() => router.push("/auth/sign-in")}>
            <Text style={styles.btnText}>Sign in</Text>
          </Pressable>
          <Pressable
            style={[styles.btn, styles.btnOutline]}
            onPress={() => router.push("/auth/sign-up")}
          >
            <Text style={styles.btnTextOutline}>Create account</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg, gap: spacing.md },
  label: { color: colors.text, fontSize: 20, fontWeight: "700" },
  email: { color: colors.muted },
  btn: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 10,
    alignItems: "center",
  },
  btnOutline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.primary,
  },
  btnText: { color: "#fff", fontWeight: "700" },
  btnTextOutline: { color: colors.primary, fontWeight: "700" },
});
