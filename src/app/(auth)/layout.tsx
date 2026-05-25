import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-8 block text-center text-2xl font-bold tracking-tight"
        >
          DoothaHub Store
        </Link>
        <div className="rounded-lg border bg-card p-8 shadow-sm">{children}</div>
      </div>
    </div>
  );
}
