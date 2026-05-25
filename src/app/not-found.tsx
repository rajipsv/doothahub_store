import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-[60vh] place-items-center px-4">
      <div className="text-center">
        <p className="text-sm font-semibold text-muted-foreground">404</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
          Page not found
        </h1>
        <p className="mt-4 text-muted-foreground">
          We couldn&apos;t find the page you&apos;re looking for.
        </p>
        <div className="mt-8">
          <Button asChild>
            <Link href="/">Back to homepage</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
