import "react-native-gesture-handler";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "@/context/auth-context";
import { colors } from "@/lib/theme";

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.bg },
              headerTintColor: colors.text,
              contentStyle: { backgroundColor: colors.bg },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="products/[slug]" options={{ title: "Product" }} />
            <Stack.Screen name="checkout/index" options={{ title: "Checkout" }} />
            <Stack.Screen name="auth/sign-in" options={{ title: "Sign in" }} />
            <Stack.Screen name="auth/sign-up" options={{ title: "Sign up" }} />
            <Stack.Screen name="orders/index" options={{ title: "Orders" }} />
            <Stack.Screen name="orders/[id]" options={{ title: "Order" }} />
          </Stack>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
