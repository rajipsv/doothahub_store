import Link from "next/link";
import { ShoppingBag, User, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getOptionalUser, SignOutButton } from "@/modules/auth";
import { getCartCount } from "@/modules/cart";

export async function Header() {
  const user = await getOptionalUser();
  const cartCount = await getCartCount();
  const isAdmin = user?.role === "ADMIN";

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="container grid h-16 grid-cols-[1fr_auto_1fr] items-center">
        <div aria-hidden className="min-w-0" />
        <Link
          href="/"
          className="text-xl font-bold tracking-tight justify-self-center"
        >
          DoothaHub
        </Link>
        <div className="flex min-w-0 items-center justify-end gap-2">
          {isAdmin ? (
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin">
                <LayoutDashboard className="mr-1 h-4 w-4" />
                Admin
              </Link>
            </Button>
          ) : null}
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/account">
                  <User className="mr-1 h-4 w-4" />
                  Account
                </Link>
              </Button>
              <SignOutButton />
            </>
          ) : (
            <Button asChild variant="ghost" size="sm">
              <Link href="/sign-in">Sign in</Link>
            </Button>
          )}
          <Button asChild variant="outline" size="sm" className="relative">
            <Link href="/cart">
              <ShoppingBag className="mr-1 h-4 w-4" />
              Cart
              {cartCount > 0 ? (
                <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                  {cartCount}
                </span>
              ) : null}
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
