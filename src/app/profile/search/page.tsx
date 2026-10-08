import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { RequestCard } from "@/components/search/RequestBoard";
import { getCurrentUser } from "@/lib/auth/session";
import { getRequests } from "@/lib/requests";
import { toBoardRequest } from "@/lib/requests/board";

export const metadata: Metadata = {
  title: "Търся",
};

// The user's own "Търся" posts, and the way to write a new one. Everybody's posts are on /search.
export default async function ProfileRequests() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const requests = (await getRequests({ viewerId: user.id, authorId: user.id })).map((request) =>
    toBoardRequest(request, user.id),
  );

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 sm:p-6">
      <h1 className="text-2xl font-bold text-brand-ink sm:text-3xl">Търся</h1>
      <p className="mt-1 text-sm text-brand-ink/60">Публикациите, в които си написал какъв продукт търсиш.</p>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-brand-rose/5 p-4">
        <p className="text-sm text-brand-ink/80">
          <span className="font-semibold text-brand-ink">Не намираш продукта?</span> Напиши какво търсиш и
          продавачите, които го имат, ще ти се обадят.
        </p>
        <Link
          href="/request"
          className="flex h-10 shrink-0 items-center gap-2 rounded-xl bg-brand-rose px-4 text-sm font-semibold text-white transition-colors hover:bg-brand"
        >
          <Plus className="size-4" aria-hidden />
          Добави публикация
        </Link>
      </div>

      {requests.length > 0 ? (
        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          {requests.map((request) => (
            <RequestCard key={request.id} request={request} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-16 text-center text-sm text-brand-ink/60">
          <span className="flex size-14 items-center justify-center rounded-full bg-brand-rose/10 text-brand-rose">
            <Search className="size-7" aria-hidden />
          </span>
          Все още нямаш публикации в „Търся“.
        </div>
      )}
    </div>
  );
}
