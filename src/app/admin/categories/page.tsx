import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CategoryManager from "@/components/admin/CategoryManager";
import { CityManager, PriceRangeForm } from "@/components/admin/FilterOptionsManager";
import { getAdmin } from "@/lib/admin";
import { getCategoryUsage } from "@/lib/categories";
import { getCities, getPriceRange } from "@/lib/options";

export const metadata: Metadata = {
  title: "Категории",
};

const card = "rounded-2xl border border-black/5 bg-white p-5 sm:p-6";

// What the search filters are made of, for the administrator to edit: the categories, the range
// of the price slider and the towns. A change shows at once in the filters of "Продавалник" and
// "Търся" and in the forms for a listing and for a post.
export default async function AdminCategories() {
  if (!(await getAdmin())) notFound();
  const [categories, priceRange, cities] = await Promise.all([getCategoryUsage(), getPriceRange(), getCities()]);

  return (
    <div className="space-y-4">
      <section className={card}>
        <h1 className="text-2xl font-bold text-brand-ink sm:text-3xl">Категории</h1>
        <p className="mt-1 text-sm text-brand-ink/60">
          Всички категории в сайта ({categories.length}). Новата категория се появява веднага във филтрите и във
          формите за обява и за публикация.
        </p>
        <CategoryManager categories={categories} />
      </section>

      <section className={card}>
        <h2 className="text-xl font-bold text-brand-ink">Ценови диапазон</h2>
        <p className="mt-1 text-sm text-brand-ink/60">
          Краищата на плъзгача за цена във филтъра. Горният край значи „и нагоре“, така че по-скъпите обяви не се
          скриват, докато плъзгачът стои в края.
        </p>
        <PriceRangeForm
          // A fresh form after a change, so it shows what is stored now.
          key={`${priceRange.min}-${priceRange.max}`}
          min={priceRange.min}
          max={priceRange.max}
        />
      </section>

      <section className={card}>
        <h2 className="text-xl font-bold text-brand-ink">Градове</h2>
        <p className="mt-1 text-sm text-brand-ink/60">
          Градовете, които се предлагат във филтъра и във формите ({cities.length}). Обявите, вече качени в даден
          град, запазват името, с което са записани.
        </p>
        <CityManager cities={cities} />
      </section>
    </div>
  );
}
