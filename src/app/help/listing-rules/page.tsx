import type { Metadata } from "next";
import Link from "next/link";
import { CircleCheck, CircleX, ClipboardList, Flag, TriangleAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "Правила за обяви",
};

const allowed = [
  "Декоративна козметика – червила, фон дьо тени, сенки, спирали",
  "Грижа за лицето, тялото и косата",
  "Парфюми – цели флакони, отливки и комплекти",
  "Бижута и аксесоари за красота",
  "Разкрасителни уреди – сешоари, преси, четки за почистване",
  "Подаръчни комплекти и мостри",
];

const notAllowed = [
  "Текстил, дрехи и домашни потреби",
  "Електроника, която не е разкрасителен уред",
  "Продукти с изтекъл срок на годност, представени като годни",
  "Фалшиви или имитации на марки",
  "Чужди или рекламни снимки вместо реални",
  "Спам и повтарящи се обяви за един и същ продукт",
];

// What happens when a listing has nothing to do with cosmetics, one warning at a time.
const warnings = [
  { label: "1-во предупреждение", text: "Обявата се премахва и получаваш имейл с обяснение." },
  { label: "2-ро предупреждение", text: "Обявата се премахва и ти напомняме, че остава едно предупреждение." },
  { label: "3-то предупреждение", text: "Профилът се изтрива. По преценка на администратор толерансът може да бъде увеличен." },
];

export default function ListingRulesPage() {
  return (
    <main className="flex flex-col flex-1 bg-zinc-50 font-sans">
      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
        <article className="text-base leading-7 text-brand-ink/80">
          <span className="flex size-12 items-center justify-center rounded-full bg-brand-rose/10 text-brand-rose">
            <ClipboardList className="size-6" aria-hidden />
          </span>
          <h1 className="mt-5 text-2xl leading-tight font-bold text-brand-ink sm:text-3xl">Правила за обяви</h1>
          <p className="mt-4">
            Тук правилата са прости – козметика, всичко около нея и добро отношение към останалите. Обявите се
            публикуват веднага, без чакане за одобрение, затова разчитаме на теб да ги спазваш.
          </p>

          <section className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-emerald-50 p-5 sm:p-6">
              <h2 className="flex items-center gap-2 font-bold text-emerald-800">
                <CircleCheck className="size-5" aria-hidden />
                Можеш да публикуваш
              </h2>
              <ul className="mt-4 space-y-3 text-sm leading-6">
                {allowed.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-emerald-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-red-50 p-5 sm:p-6">
              <h2 className="flex items-center gap-2 font-bold text-red-800">
                <CircleX className="size-5" aria-hidden />
                Не се допуска
              </h2>
              <ul className="mt-4 space-y-3 text-sm leading-6">
                {notAllowed.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-red-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="mt-14">
            <h2 className="flex items-center gap-2 text-xl font-bold text-brand-ink sm:text-2xl">
              <TriangleAlert className="size-6 text-brand-rose" aria-hidden />
              Три предупреждения
            </h2>
            <p className="mt-2 text-brand-ink/60">
              Когато обява няма нищо общо с козметика, тя се премахва и се отброява предупреждение.
            </p>
            <ol className="mt-6 grid gap-4 sm:grid-cols-3">
              {warnings.map(({ label, text }, index) => (
                <li key={label} className="rounded-2xl border border-black/5 bg-white p-5">
                  {/* One more filled dot for each warning. */}
                  <div aria-hidden className="flex gap-1.5">
                    {warnings.map((_, dot) => (
                      <span
                        key={dot}
                        className={`size-2.5 rounded-full ${dot <= index ? "bg-brand-rose" : "bg-brand-rose/15"}`}
                      />
                    ))}
                  </div>
                  <h3 className="mt-4 font-bold text-brand-ink">{label}</h3>
                  <p className="mt-1 text-sm leading-6">{text}</p>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-sm text-brand-ink/60">
              Ако се притесняваш за профила си, свържи се с администратор и случаят ще бъде разгледан.
            </p>
          </section>

          <aside className="mt-10 flex gap-3 rounded-2xl bg-brand-rose/10 p-5">
            <Flag className="mt-1 size-5 shrink-0 text-brand-rose" aria-hidden />
            <div>
              <h3 className="font-bold text-brand-ink">Видя нещо нередно?</h3>
              <p className="mt-1">
                Използвай бутона „Докладвай“ в обявата. Администратор ще прегледа сигнала. Пълните правила ще
                намериш в{" "}
                <Link href="/terms" className="font-semibold text-brand-rose hover:underline">
                  Правила и условия
                </Link>
                .
              </p>
            </div>
          </aside>
        </article>
      </div>
    </main>
  );
}
