import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { requireUser, SignOutButton } from "@/modules/auth";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();
  return (
    <div className="storefront flex min-h-screen flex-col bg-background">
      <Header />
      <div className="container flex-1 py-10">
        <div className="grid gap-8 md:grid-cols-[200px_1fr]">
          <nav className="space-y-2 text-sm font-medium">
            <Link href="/account" className="block hover:underline">
              Profile
            </Link>
            <Link href="/account/orders" className="block hover:underline">
              Orders
            </Link>
            <Link href="/account/addresses" className="block hover:underline">
              Addresses
            </Link>
            <div className="pt-4">
              <SignOutButton variant="link" />
            </div>
          </nav>
          <main>{children}</main>
        </div>
      </div>
      <Footer />
    </div>
  );
}
