import type { Metadata } from "next";
import { CreditCard, Gift, HandCoins, Info, Truck } from "lucide-react";

export const metadata: Metadata = {
  title: "Такси и плащане",
};

const FREE_LISTINGS = 3;
const EXTRA_LISTING_FEE = "€0.80";

const free = [
  "Разглеждане и търсене на обяви – дори без профил",
  "Регистрация и профил",
  "Съобщения между купувач и продавач",
  "Любими обяви и известия",
  `Първите ${FREE_LISTINGS} обяви на всеки потребител`,
];

const paymentWays = [
  { icon: HandCoins, title: "При лично предаване", text: "Плащате на ръка при срещата, след като купувачът види продукта." },
  { icon: Truck, title: "С наложен платеж", text: "Куриерът събира сумата от купувача и я превежда на продавача." },
  { icon: CreditCard, title: "По банков път", text: "Само ако се познавате или вече имате доверие един към друг." },
];

export default function FeesPage() {
  return (
    <main className="flex flex-col flex-1 bg-zinc-50 font-sans">
      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
        <article className="text-base leading-7 text-brand-ink/80">
          <span className="flex size-12 items-center justify-center rounded-full bg-brand-rose/10 text-brand-rose">
            <CreditCard className="size-6" aria-hidden />
          </span>
          <h1 className="mt-5 text-2xl leading-tight font-bold text-brand-ink sm:text-3xl">Такси и плащане</h1>
          <p className="mt-4">Без скрити такси и без комисиона от продажбата. Ето всичко, което трябва да знаеш.</p>

          {/* The two prices side by side, like a small price list. */}
          <section className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-black/5 bg-white p-6">
              <p className="text-sm font-semibold tracking-wider text-brand-rose uppercase">Обяви 1 – {FREE_LISTINGS}</p>
              <p className="mt-2 text-4xl font-bold text-brand-ink">€0</p>
              <p className="mt-2 text-sm leading-6">Всеки потребител публикува първите си {FREE_LISTINGS} обяви безплатно.</p>
            </div>
            <div className="rounded-2xl bg-brand-ink p-6 text-white">
              <p className="text-sm font-semibold tracking-wider text-brand-pale uppercase">Всяка следваща обява</p>
              <p className="mt-2 text-4xl font-bold">{EXTRA_LISTING_FEE}</p>
              <p className="mt-2 text-sm leading-6 text-white/70">Еднократно, за публикуването. Без такса от продажбата.</p>
            </div>
          </section>

          <section className="mt-14">
            <h2 className="flex items-center gap-2 text-xl font-bold text-brand-ink sm:text-2xl">
              <Gift className="size-6 text-brand-rose" aria-hidden />
              Винаги безплатно
            </h2>
            <ul className="mt-6 space-y-3">
              {free.map((item) => (
                <li key={item} className="flex gap-3">
                  <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-brand-rose" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-14">
            <h2 className="text-xl font-bold text-brand-ink sm:text-2xl">Как се плаща за продукта?</h2>
            <p className="mt-2 text-brand-ink/60">
              Плащането е между купувача и продавача. Уговорете го в съобщенията, преди продуктът да тръгне.
            </p>
            <ul className="mt-6 grid gap-4 sm:grid-cols-3">
              {paymentWays.map(({ icon: Icon, title, text }) => (
                <li key={title} className="rounded-2xl border border-black/5 bg-white p-5">
                  <span className="flex size-10 items-center justify-center rounded-full bg-brand-rose/10 text-brand-rose">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 font-bold text-brand-ink">{title}</h3>
                  <p className="mt-1 text-sm leading-6">{text}</p>
                </li>
              ))}
            </ul>
          </section>

          <aside className="mt-10 flex gap-3 rounded-2xl bg-brand-rose/10 p-5">
            <Info className="mt-1 size-5 shrink-0 text-brand-rose" aria-hidden />
            <div>
              <h3 className="font-bold text-brand-ink">Важно</h3>
              <p className="mt-1">
                Платформата не е страна по сделката и не участва в плащането или доставката. Цената, начинът на
                плащане и куриерските разходи се договарят директно между купувача и продавача.
              </p>
            </div>
          </aside>
        </article>
      </div>
    </main>
  );
}
