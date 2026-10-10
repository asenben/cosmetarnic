import Image from "next/image";
import Link from "next/link";
import RequestActions from "@/components/search/RequestActions";
import { listingImageUrl } from "@/lib/listings/images";
import type { ProductRequest } from "@/lib/requests";
import { formatPrice } from "@/lib/format";

const dateFormat = new Intl.DateTimeFormat("bg-BG", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Europe/Sofia",
});

type RequestsTableProps = {
  requests: ProductRequest[];
  // Left out on an author's own page, where every post is theirs.
  showAuthor?: boolean;
};

// The administrator's list of "Търся" posts: each opens on its page, and can be edited or
// deleted whoever wrote it.
export default function RequestsTable({ requests, showAuthor = true }: RequestsTableProps) {
  if (requests.length === 0) {
    return <p className="py-10 text-center text-sm text-brand-ink/60">Няма публикации.</p>;
  }

  return (
    <ul className="divide-y divide-black/5">
      {requests.map((request) => (
        <li key={request.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 py-3">
          <Link
            href={`/search/${request.id}`}
            className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-brand-pale"
            aria-label={`Отвори публикацията „${request.title}“`}
          >
            {request.image ? (
              <Image src={listingImageUrl(request.image)} alt="" fill sizes="56px" className="object-cover" />
            ) : (
              <Image src="/images/logo.svg" alt="" fill sizes="56px" className="p-2.5 opacity-80" />
            )}
          </Link>

          <div className="min-w-0 flex-1 basis-56">
            <Link
              href={`/search/${request.id}`}
              className="block truncate text-sm font-semibold text-brand-ink transition-colors hover:text-brand-rose"
            >
              {request.title}
            </Link>
            <p className="truncate text-xs text-brand-ink/60">
              {[request.brand, request.city, dateFormat.format(request.createdAt)].filter(Boolean).join(" · ")}
            </p>
            {showAuthor && (
              <p className="truncate text-xs text-brand-ink/60">
                Търси:{" "}
                <Link href={`/admin/users/${request.userId}`} className="font-semibold text-brand-rose hover:underline">
                  {request.author.username}
                </Link>
              </p>
            )}
          </div>

          <p className="w-28 shrink-0 text-right text-sm font-bold text-brand-ink">
            {request.budget === null ? "По договаряне" : formatPrice(request.budget)}
          </p>

          <RequestActions id={request.id} className="w-56 shrink-0" />
        </li>
      ))}
    </ul>
  );
}
