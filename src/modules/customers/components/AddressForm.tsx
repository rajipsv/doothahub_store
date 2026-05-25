"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAddressAction } from "@/modules/customers/actions/profile";

export function AddressForm() {
  return (
    <form action={createAddressAction} className="grid gap-3 sm:grid-cols-2">
      <Field name="fullName" label="Full name" required />
      <Field name="phone" label="Phone" />
      <Field name="line1" label="Address line 1" required className="sm:col-span-2" />
      <Field name="line2" label="Address line 2" className="sm:col-span-2" />
      <Field name="city" label="City" required />
      <Field name="region" label="State / region" required />
      <Field name="postalCode" label="Postal code" required />
      <Field name="country" label="Country (2-letter)" required />
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input type="checkbox" name="isDefault" />
        Set as default
      </label>
      <div className="sm:col-span-2">
        <Button type="submit">Add address</Button>
      </div>
    </form>
  );
}

function Field({
  name,
  label,
  required,
  className,
}: {
  name: string;
  label: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={`space-y-1 ${className ?? ""}`}>
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} required={required} />
    </div>
  );
}
