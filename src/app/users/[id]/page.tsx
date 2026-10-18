import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FileText, Package } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import ProfileHeader from "@/components/profile/ProfileHeader";
import { getPublicProfile } from "@/lib/auth/profile";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserListings, postedAgo } from "@/lib/listings";
import { listingImageUrl } from "@/lib/listings/images";

const card = "rounded-2xl border border-black/5 bg-white";

export async function generateMetadata({ params }: PageProps<"/users/[id]">): Promise<Metadata> {
  const profile = await getPublicProfile((await params).id);
  return profile ? { title: profile.username } : {};
}

// A seller's page as everybody sees it: who they are, and what they have on sale.
export default async function UserProfile({ params }: PageProps<"/users/[id]">) {
  const { id } = await params;
  const viewer = await getCurrentUser();
  const profile = await getPublicProfile(id, viewer?.role === "admin");
  if (!profile) notFound();
  const listings = await getUserListings(profile.id, true);

  return (
    <main className="flex flex-col flex-1 bg-zinc-50 font-sans">
      <div className="mx-auto w-full max-w-7xl space-y-4 px-4 py-6 sm:px-6">
        <section className={`${card} p-5 shadow-sm shadow-brand-ink/5 sm:p-8`}>
          <ProfileHeader
            username={profile.username}
            avatar={profile.avatar}
            city={profile.city}
            memberSince={profile.createdAt}
            links={profile.links}
          />

          {profile.bio && (
            <div className="mt-6 border-t border-black/5 pt-6">
              <div className="rounded-2xl bg-brand-rose/5 p-4 sm:p-6">
                <h2 className="flex items-center gap-2.5 text-lg font-bold text-brand-ink">
                  <FileText className="size-5 text-brand-ink/60" aria-hidden />
                  За мен
                </h2>
                <p className="mt-3 max-w-4xl text-sm leading-6 wrap-anywhere whitespace-pre-line text-brand-ink/80 sm:text-base sm:leading-7">
                  {profile.bio}
                </p>
              </div>
            </div>
          )}
        </section>

        <section className={`${card} p-5 sm:p-6`}>
          <h2 className="flex items-baseline gap-2 text-xl font-bold text-brand-ink sm:text-2xl">
            Обяви
            {/* The count is one of the numbers the seller can hide in the settings. */}
            {profile.show_stats && <span className="text-base font-medium text-brand-ink/60">{listings.length}</span>}
          </h2>

          {listings.length > 0 ? (
            // Two across on phones, four on wide screens.
            <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {listings.map((listing) => (
                <ProductCard
                  key={listing.id}
                  id={listing.id}
                  href={`/product/${listing.id}`}
                  image={listing.images[0] && listingImageUrl(listing.images[0])}
                  brand={listing.brand}
                  price={listing.price}
                  oldPrice={listing.oldPrice}
                  city={listing.city}
                  postedAgo={postedAgo(listing.createdAt)}
                  condition={listing.condition}
                  delivery={listing.delivery}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-16 text-center text-sm text-brand-ink/60">
              <span className="flex size-14 items-center justify-center rounded-full bg-brand-rose/10 text-brand-rose">
                <Package className="size-7" aria-hidden />
              </span>
              Този продавач няма активни обяви в момента.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
