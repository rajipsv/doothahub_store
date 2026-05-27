import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-white/10 bg-muted/40">
      <div className="container grid gap-8 py-12 md:grid-cols-4">
        <div>
          <p className="font-display text-lg font-bold">
            <span className="text-gradient-tech">DoothaHub</span>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Modern e-commerce, built for performance.
          </p>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold">Shop</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/products">All products</Link></li>
            <li><Link href="/categories/apparel">Apparel</Link></li>
            <li><Link href="/categories/footwear">Footwear</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold">Account</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/account">My account</Link></li>
            <li><Link href="/account/orders">Orders</Link></li>
            <li><Link href="/sign-in">Sign in</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold">Legal</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/privacy">Privacy</Link></li>
            <li><Link href="/terms">Terms</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t py-4">
        <p className="container text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} DoothaHub Store. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
