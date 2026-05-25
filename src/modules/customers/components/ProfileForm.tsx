"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfileAction } from "@/modules/customers/actions/profile";

type Props = {
  defaultName?: string | null;
  defaultPhone?: string | null;
};

export function ProfileForm({ defaultName, defaultPhone }: Props) {
  return (
    <form action={updateProfileAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={defaultName ?? ""} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" defaultValue={defaultPhone ?? ""} />
      </div>
      <Button type="submit">Save</Button>
    </form>
  );
}
