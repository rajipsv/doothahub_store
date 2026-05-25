import type { Metadata } from "next";
import { requireUser } from "@/modules/auth";
import {
  AddressForm,
  deleteAddressAction,
  listAddresses,
} from "@/modules/customers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Addresses" };

export default async function AddressesPage() {
  const user = await requireUser();
  const addresses = await listAddresses(user.id);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Addresses</h1>
        <p className="text-sm text-muted-foreground">
          Manage shipping and billing addresses.
        </p>
      </header>

      <section className="space-y-3">
        {addresses.length === 0 ? (
          <p className="text-muted-foreground">No addresses yet.</p>
        ) : (
          addresses.map((a) => (
            <div
              key={a.id}
              className="flex items-start justify-between rounded-lg border bg-card p-4"
            >
              <div className="text-sm">
                <p className="font-medium">
                  {a.fullName}
                  {a.isDefault ? (
                    <Badge className="ml-2" variant="success">
                      Default
                    </Badge>
                  ) : null}
                </p>
                <p>{a.line1}</p>
                {a.line2 ? <p>{a.line2}</p> : null}
                <p>
                  {a.city}, {a.region} {a.postalCode}
                </p>
                <p>{a.country}</p>
              </div>
              <form action={deleteAddressAction}>
                <input type="hidden" name="id" value={a.id} />
                <Button type="submit" variant="ghost" size="sm">
                  Delete
                </Button>
              </form>
            </div>
          ))
        )}
      </section>

      <section className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Add a new address</h2>
        <AddressForm />
      </section>
    </div>
  );
}
