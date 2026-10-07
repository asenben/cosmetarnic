import Marketplace, { type MarketplaceListing } from "@/components/Marketplace";
import { products } from "@/data/products";

export default function Home() {
  const listings: MarketplaceListing[] = products.map(
    ({ id, images, brand, price, city, postedAgo, condition, delivery, category }) => ({
      id,
      href: `/product/${id}`,
      image: images[0],
      brand,
      price,
      city,
      postedAgo,
      condition,
      delivery,
      category,
    }),
  );

  return (
    <main className="flex flex-col flex-1 bg-zinc-50 font-sans">
      <div className="mx-auto flex w-full max-w-7xl items-start gap-6 px-4 py-6 sm:px-6">
        <Marketplace listings={listings} />
      </div>
    </main>
  );
}
