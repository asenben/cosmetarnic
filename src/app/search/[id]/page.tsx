import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import ProductGallery from "@/components/ProductGallery";
import RequestSidebar from "@/components/search/RequestSidebar";
import { categories } from "@/data/listingOptions";
import { avatarUrl } from "@/lib/auth/avatar";
import { getCurrentUser } from "@/lib/auth/session";
import { postedAgo } from "@/lib/listings";
import { listingImageUrl } from "@/lib/listings/images";
import { getRequest } from "@/lib/requests";

const monthAndYear = new Intl.DateTimeFormat("bg-BG", { month: "long", year: "numeric" });

export async function generateMetadata({ params }: PageProps<"/search/[id]">): Promise<Metadata> {
  const request = await getRequest((await params).id);
  return request ? { title: request.title } : {};
}

// The page of one "Търся" post, laid out like a listing's page: the picture and the description
// on the left, the details and the way to get in touch on the right.
export default async function RequestPage({ params }: PageProps<"/search/[id]">) {
  const [{ id }, user] = await Promise.all([params, getCurrentUser()]);
  const request = await getRequest(id, user?.id);
  if (!request) notFound();

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
            <li className="flex items-center gap-1.5">
              <ChevronRight className="size-4" aria-hidden />
              <Link href="/search" className="transition-colors hover:text-brand-rose">
                Търся
              </Link>
            </li>
            <li className="flex items-center gap-1.5 font-medium text-brand-ink" aria-current="page">
              <ChevronRight className="size-4" aria-hidden />
              {request.title}
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
                images={request.image ? [listingImageUrl(request.image)] : []}
                alt={request.title}
                badge="Търся"
              />
            </div>

            <section className="order-3 min-w-0 rounded-2xl border border-black/5 bg-white p-4 sm:p-5 lg:order-none">
              <h2 className="text-sm font-bold tracking-wider text-brand-ink uppercase">Описание</h2>
              {/* Cleaned when the post was saved (see src/lib/listings/description.ts). */}
              <div
                className="rich-text mt-3 text-base wrap-break-word text-brand-ink/80"
                dangerouslySetInnerHTML={{ __html: request.description }}
              />
            </section>
          </div>

          <RequestSidebar
            request={{
              id: request.id,
              title: request.title,
              brand: request.brand,
              categoryLabel: categories.find(({ value }) => value === request.category)?.label ?? "",
              condition: request.condition,
              budget: request.budget,
              city: request.city,
              postedAgo: postedAgo(request.createdAt),
              author: {
                username: request.author.username,
                avatar: avatarUrl(request.author.avatar),
                memberSince: monthAndYear.format(request.authorSince).replace(" г.", ""),
              },
              own: request.userId === user?.id,
              favorite: request.favorite,
            }}
          />
        </div>
      </div>
    </main>
  );
}
