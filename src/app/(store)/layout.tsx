import { Space_Grotesk } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`storefront dark ${display.variable} flex min-h-screen flex-col bg-background font-sans text-foreground`}
    >
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
