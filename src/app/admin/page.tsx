import { redirect } from "next/navigation";
import { FIRST_ADMIN_SECTION } from "@/lib/admin/sections";

// The panel has no page of its own yet: it opens on its first section.
export default function Admin() {
  redirect(`/admin/${FIRST_ADMIN_SECTION}`);
}
