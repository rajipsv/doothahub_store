import Link from "next/link";
import {
  LayoutDashboard,
  ShoppingBag,
  Store,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getOptionalUser, SignOutButton } from "@/modules/auth";
import { getCartCount } from "@/modules/cart";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { cn } from "@/lib/utils";

const navBtn = "h-9 shrink-0 px-2 sm:px-3";
const iconOnly = "w-9 px-0 sm:w-auto";

export async function Header() {
  const user = await getOptionalUser();
  const cartCount = await getCartCount();
  const isAdmin = user?.role === "ADMIN";

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/70 backdrop-blur-xl dark:border-white/10 safe-area-top">
      <div className="container flex h-14 items-center justify-between gap-3 md:h-[4.5rem]">
        <Link
          href="/"
          className="font-display min-w-0 shrink truncate text-lg font-bold tracking-tight sm:text-2xl md:text-3xl"
        >
          <span className="text-gradient-tech">DoothaHub</span>
        </Link>

        <nav
          className="flex shrink-0 items-center gap-0.5 sm:gap-1"
          aria-label="Main"
        >
          <Button
            asChild
            variant="ghost"
            size="sm"
            className={cn(navBtn, iconOnly)}
          >
            <Link href="/products" aria-label="Shop">
              <Store className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Shop</span>
            </Link>
          </Button>

          <ThemeToggle />

          {isAdmin ? (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className={cn(navBtn, iconOnly)}
            >
              <Link href="/admin" aria-label="Admin">
                <LayoutDashboard className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            </Button>
          ) : null}

          {user ? (
            <>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className={cn(navBtn, iconOnly)}
              >
                <Link href="/account" aria-label="Account">
                  <User className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Account</span>
                </Link>
              </Button>
              <SignOutButton className="hidden md:inline-flex" />
            </>
          ) : (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className={cn(navBtn, iconOnly)}
            >
              <Link href="/sign-in" aria-label="Sign in">
                <User className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Sign in</span>
              </Link>
            </Button>
          )}

          <Button
            asChild
            variant="outline"
            size="sm"
            className={cn("relative", navBtn, iconOnly)}
          >
            <Link
              href="/cart"
              aria-label={
                cartCount > 0 ? `Cart, ${cartCount} items` : "Cart"
              }
            >
              <ShoppingBag className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Cart</span>
              {cartCount > 0 ? (
                <span
                  className={cn(
                    "rounded-full bg-primary text-primary-foreground",
                    "absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center px-1 text-[10px] font-medium leading-none",
                    "sm:static sm:ml-1 sm:h-auto sm:min-w-0 sm:px-2 sm:py-0.5 sm:text-xs",
                  )}
                >
                  {cartCount}
                </span>
              ) : null}
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
