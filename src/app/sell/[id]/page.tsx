import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";
import ListingForm from "@/components/sell/ListingForm";
import { getCurrentUser } from "@/lib/auth/session";
import { getEditableListing } from "@/lib/listings";

export const metadata: Metadata = {
  title: "Редактиране на обява",
};

// The listing form, filled in with one of the user's own listings, for changing it.
export default async function EditListingPage({ params }: PageProps<"/sell/[id]">) {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const { id } = await params;
  // Somebody else's listing is treated like one that does not exist, except for an administrator.
  const listing = await getEditableListing(user, id);
  if (!listing) notFound();

  return (
    <main className="flex flex-col flex-1 bg-zinc-50 font-sans">
      <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6">
        <nav aria-label="Навигационна пътека">
          <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-brand-ink/60">
            <li>
              <Link href="/" className="transition-colors hover:text-brand-rose">
                Начало
              </Link>
            </li>
            <li className="flex items-center gap-1.5">
              <ChevronRight className="size-4" aria-hidden />
              <Link href="/profile/listings" className="transition-colors hover:text-brand-rose">
                Моите обяви
              </Link>
            </li>
            <li className="flex items-center gap-1.5 font-medium text-brand-ink" aria-current="page">
              <ChevronRight className="size-4" aria-hidden />
              Редактиране на „{listing.title}“
            </li>
          </ol>
        </nav>

        <ListingForm
          listing={{
            id: listing.id,
            title: listing.title,
            price: listing.price,
            brand: listing.brand,
            category: listing.category,
            condition: listing.condition,
            color: listing.color,
            delivery: listing.delivery,
            phone: listing.phone,
            city: listing.city,
            description: listing.description,
            images: listing.images,
          }}
        />
      </div>
    </main>
  );
}
