import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";
import RequestForm from "@/components/search/RequestForm";
import { getCurrentUser } from "@/lib/auth/session";
import { getEditableRequest } from "@/lib/requests";

export const metadata: Metadata = {
  title: "Редактиране на публикация",
};

// The "Търся" form, filled in with one of the user's own posts, for changing it.
export default async function EditRequestPage({ params }: PageProps<"/request/[id]">) {
  const user = await getCurrentUser();
  if (!user) redirect("/search");

  const { id } = await params;
  // Somebody else's post is treated like one that does not exist, except for an administrator.
  const request = await getEditableRequest(user, id);
  if (!request) notFound();

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
              <Link href="/profile/search" className="transition-colors hover:text-brand-rose">
                Търся
              </Link>
            </li>
            <li className="flex items-center gap-1.5 font-medium text-brand-ink" aria-current="page">
              <ChevronRight className="size-4" aria-hidden />
              Редактиране на „{request.title}“
            </li>
          </ol>
        </nav>

        <RequestForm
          returnTo={request.userId === user.id ? undefined : "/admin/requests"}
          request={{
            id: request.id,
            title: request.title,
            description: request.description,
            categories: request.categories,
            brand: request.brand,
            condition: request.condition,
            budget: request.budget,
            city: request.city,
            phone: request.phone,
            image: request.image,
          }}
        />
      </div>
    </main>
  );
}
