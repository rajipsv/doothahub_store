import type { Metadata } from "next";
import { ProfileForm } from "@/modules/customers";
import { requireUser } from "@/modules/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Profile" };

export default async function AccountPage() {
  const session = await requireUser();
  const user = await db.user.findUnique({ where: { id: session.id } });

  return (
    <div className="max-w-xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Your profile</h1>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
      </header>
      <ProfileForm defaultName={user?.name} defaultPhone={user?.phone} />
    </div>
  );
}
