import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Eye, Flag } from "lucide-react";
import ProductGallery from "@/components/ProductGallery";
import ProductSidebar from "@/components/ProductSidebar";
import { products } from "@/data/products";

const conditionLabels = { new: "Ново", used: "Използвано" };

export default async function ProductPage({ params }: PageProps<"/product/[id]">) {
  const { id } = await params;
  const product = products.find((item) => item.id === id);
  if (!product) notFound();

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

        <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1fr)_26rem]">
          <div className="space-y-6">
            <ProductGallery images={product.images} alt={product.title} badge={conditionLabels[product.condition]} />

            <section className="rounded-2xl border border-black/5 bg-white p-5">
              <h2 className="text-sm font-bold tracking-wider text-brand-ink uppercase">Описание</h2>
              <p className="mt-3 text-sm leading-6 whitespace-pre-line text-brand-ink/80">{product.description}</p>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-brand-ink/80 marker:text-brand-rose">
                {product.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>

              <div className="mt-6 flex items-center justify-between gap-4 border-t border-black/5 pt-4 text-xs text-brand-ink/60">
                <span>ID: {product.id}</span>
                <span className="flex items-center gap-1.5">
                  <Eye className="size-4" aria-hidden />
                  <span className="sr-only">Преглеждания:</span>
                  {product.views}
                </span>
                <button
                  type="button"
                  className="flex cursor-pointer items-center gap-1.5 transition-colors hover:text-brand-rose"
                >
                  <Flag className="size-4" aria-hidden />
                  Докладвай
                </button>
              </div>
            </section>
          </div>

          <div>
            <ProductSidebar product={product} />
          </div>
        </div>
      </div>
    </main>
  );
}
