import type { BoardRequest } from "@/components/search/RequestBoard";
import { categories } from "@/data/listingOptions";
import { postedAgo } from "@/lib/listings";
import { listingImageUrl } from "@/lib/listings/images";
import type { ProductRequest } from "@/lib/requests";

// A stored "Търся" post in the shape its card shows. `viewerId` is the signed-in user, who gets
// the buttons for editing and deleting on their own posts.
export function toBoardRequest(request: ProductRequest, viewerId?: string | null): BoardRequest {
  return {
    id: request.id,
    title: request.title,
    category: request.category,
    categoryLabel: categories.find(({ value }) => value === request.category)?.label ?? "",
    condition: request.condition,
    budget: request.budget,
    city: request.city,
    image: request.image ? listingImageUrl(request.image) : null,
    postedAgo: postedAgo(request.createdAt),
    author: request.author.username,
    own: request.userId === viewerId,
    favorite: request.favorite,
  };
}
