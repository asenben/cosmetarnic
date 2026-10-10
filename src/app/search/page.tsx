import type { Metadata } from "next";
import RequestBoard from "@/components/search/RequestBoard";
import { getCurrentUser } from "@/lib/auth/session";
import { getCategories } from "@/lib/categories";
import { getRequests } from "@/lib/requests";
import { toBoardRequest } from "@/lib/requests/board";

export const metadata: Metadata = {
  title: "Търся",
};

// The "Търся" page: posts by registered users about products they are looking for, with the same
// filters, sorting and views as the marketplace. These are not listings; nothing here is on sale.
export default async function Search() {
  const [user, categories] = await Promise.all([getCurrentUser(), getCategories()]);
  const requests = (await getRequests({ viewerId: user?.id })).map((request) =>
    toBoardRequest(request, categories, user?.id),
  );

  return (
    <main className="flex flex-col flex-1 bg-zinc-50 font-sans">
      <div className="mx-auto flex w-full max-w-7xl items-start gap-6 px-4 py-6 sm:px-6">
        <RequestBoard requests={requests} />
      </div>
    </main>
  );
}
