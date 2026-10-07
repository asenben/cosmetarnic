import FiltersSidebar from "@/components/FiltersSidebar";
import ProductCard from "@/components/ProductCard";
import ProductGrid from "@/components/ProductGrid";
import { products } from "@/data/products";

export default function Home() {
  return (
    <main className="flex flex-col flex-1 bg-zinc-50 font-sans">
      <div className="mx-auto flex w-full max-w-7xl items-start gap-6 px-4 py-6 sm:px-6">
        <FiltersSidebar />
        <ProductGrid count={products.length}>
          {products.map(({ id, images, brand, price, city, postedAgo, condition, delivery }) => (
            <ProductCard
              key={id}
              href={`/product/${id}`}
              image={images[0]}
              brand={brand}
              price={price}
              city={city}
              postedAgo={postedAgo}
              condition={condition}
              delivery={delivery}
            />
          ))}
        </ProductGrid>
      </div>
    </main>
  );
}
