import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Eye, ShieldCheck } from "lucide-react";
import ProductGallery from "@/components/ProductGallery";
import ProductSidebar from "@/components/ProductSidebar";
import ReportButton from "@/components/ReportButton";
import ListingActions from "@/components/sell/ListingActions";
import { getCategories, type Category } from "@/lib/categories";
import type { ProductDetails } from "@/data/product";
import { avatarUrl } from "@/lib/auth/avatar";
import { getCurrentUser } from "@/lib/auth/session";
import { getListingTitle, postedAgo, viewerKey, viewListing, type Listing } from "@/lib/listings";
import { listingImageUrl } from "@/lib/listings/images";

const conditionLabels = { new: "Ново", used: "Използвано" };

const monthAndYear = new Intl.DateTimeFormat("bg-BG", { month: "long", year: "numeric" });

// A published listing in the shape the page was built around.
function toProduct(listing: Listing, categories: Category[]): ProductDetails {
  const category = categories.find(({ value }) => value === listing.category);
  return {
    id: listing.id,
    number: listing.number,
    brand: listing.brand,
    price: listing.price,
    city: listing.city,
    postedAgo: postedAgo(listing.createdAt),
    condition: listing.condition,
    delivery: listing.delivery,
    images: listing.images.map(listingImageUrl),
    title: listing.title,
    category: listing.category,
    categories: ["Красота и козметика", ...(category ? [category.label] : [])],
    sellerProfile: {
      name: listing.seller.username,
      handle: listing.seller.username,
      memberSince: monthAndYear.format(listing.seller.createdAt).replace(" г.", ""),
      listings: listing.seller.listings,
      avatar: avatarUrl(listing.seller.avatar) ?? undefined,
    },
    color: listing.color,
    phone: listing.phone,
    descriptionHtml: listing.description,
    views: listing.views,
  };
}

export async function generateMetadata({ params }: PageProps<"/product/[id]">): Promise<Metadata> {
  const title = await getListingTitle((await params).id);
  return title ? { title } : {};
}

export default async function ProductPage({ params }: PageProps<"/product/[id]">) {
  const { id } = await params;
  const [requestHeaders, user] = await Promise.all([headers(), getCurrentUser()]);
  // The first address in the list is the visitor's own; the rest are the proxies on the way.
  const address = requestHeaders.get("x-forwarded-for")?.split(",")[0].trim() ?? "";
  const listing = await viewListing(id, {
    key: viewerKey(address, requestHeaders.get("user-agent") ?? ""),
    userId: user?.id,
    admin: user?.role === "admin",
  });
  if (!listing) notFound();
  const product = toProduct(listing, await getCategories());

  return (
    <main className="flex flex-col flex-1 bg-zinc-50 font-sans">
      <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6">
        {/* Left out on phones, where it wraps over several lines and pushes the photo down. */}
        <nav aria-label="Навигационна пътека" className="hidden md:block">
          <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-brand-ink/60">
            <li>
              <Link href="/" className="transition-colors hover:text-brand-rose">
                Начало
              </Link>
            </li>
            {product.categories.map((category) => (
              <li key={category} className="flex items-center gap-1.5">
                <ChevronRight className="size-4" aria-hidden />
                {category}
              </li>
            ))}
            <li className="flex items-center gap-1.5 font-medium text-brand-ink" aria-current="page">
              <ChevronRight className="size-4" aria-hidden />
              {product.brand} {product.title}
            </li>
          </ol>
        </nav>

        {/* Wide screens: the photo with the description under it on the left, the details on the
            right. Phones: one column in the order photo, details, description, so the name and
            the price come straight after the photo. */}
        <div className="grid grid-cols-1 gap-6 md:mt-4 lg:grid-cols-[minmax(0,1fr)_26rem] lg:gap-8">
          <div className="contents lg:block lg:space-y-6">
            <div className="order-1 min-w-0 lg:order-none">
              <ProductGallery
                images={product.images}
                alt={product.title}
                badge={conditionLabels[product.condition]}
              />
            </div>

            <section className="order-3 min-w-0 rounded-2xl border border-black/5 bg-white p-4 sm:p-5 lg:order-none">
              <h2 className="text-sm font-bold tracking-wider text-brand-ink uppercase">Описание</h2>
              {/* Cleaned when the listing was saved (see src/lib/listings/description.ts). */}
              <div
                className="rich-text mt-3 text-base wrap-break-word text-brand-ink/80"
                dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
              />

              <div className="mt-6 flex items-center justify-between gap-4 border-t border-black/5 pt-4 text-xs text-brand-ink/60">
                <span>ID: {product.number}</span>
                <span className="flex items-center gap-1.5">
                  <Eye className="size-4" aria-hidden />
                  <span className="sr-only">Преглеждания:</span>
                  {product.views}
                </span>
                {/* Nobody reports their own listing. */}
                {user?.id === listing.userId ? <span /> : <ReportButton listingId={listing.id} />}
              </div>
            </section>
          </div>

          <div className="order-2 min-w-0 space-y-5 lg:order-none">
            {/* The buttons for editing and deleting the listing: for the seller, and for an
                administrator on anybody's listing, with the way to the seller's profile. */}
            {user?.id === listing.userId ? (
              <section className="rounded-2xl border border-black/5 bg-white p-5">
                <h2 className="text-base font-bold text-brand-ink">Това е твоя обява</h2>
                <ListingActions id={listing.id} afterDelete="/profile/listings" className="mt-3" />
              </section>
            ) : (
              user?.role === "admin" && (
                <section className="rounded-2xl border border-brand-rose/30 bg-white p-5">
                  <h2 className="flex items-center gap-2 text-base font-bold text-brand-ink">
                    <ShieldCheck className="size-5 text-brand-rose" aria-hidden />
                    Администратор
                  </h2>
                  <p className="mt-1 text-sm text-brand-ink/60">
                    Обява на{" "}
                    <Link href={`/admin/users/${listing.userId}`} className="font-semibold text-brand-rose hover:underline">
                      {listing.seller.username}
                    </Link>
                  </p>
                  <ListingActions id={listing.id} afterDelete="/admin/listings" className="mt-3" />
                </section>
              )
            )}
            <ProductSidebar product={product} />
          </div>
        </div>
      </div>
    </main>
  );
}
