import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Camera,
  CircleCheck,
  CircleX,
  Clock,
  HeartHandshake,
  Lightbulb,
  MessageCircle,
  Package,
  PenLine,
  RefreshCw,
  Tag,
  type LucideIcon,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Съвети за успешна продажба",
};

type Tip = {
  icon: LucideIcon;
  title: string;
  text: string;
};

const tips: Tip[] = [
  {
    icon: Camera,
    title: "Снимката е витрината ти",
    text: "Дневна светлина, чист фон и няколко ъгъла. Покажи етикета, срока на годност и колко е останало в опаковката. Обява с повече снимки печели повече доверие.",
  },
  {
    icon: PenLine,
    title: "Пиши като приятелка",
    text: "Защо купи продукта, защо се разделяш с него, за какъв тип кожа е. Честното описание спестява десет въпроса в съобщенията и привлича точния купувач.",
  },
  {
    icon: Tag,
    title: "Цена, която казва „вземи ме“",
    text: "Провери колко струва продуктът нов и колко струват подобни обяви в сайта. Справедливата цена продава за дни, а прекалено високата – за месеци.",
  },
  {
    icon: MessageCircle,
    title: "Отговаряй бързо",
    text: "Купувачът, който пише днес, утре може да е намерил друго. Бързият и учтив отговор често е разликата между „ще помисля“ и „вземам го“.",
  },
  {
    icon: Package,
    title: "Опаковай с любов",
    text: "Увий стъкления флакон, запечатай течностите, добави мостра или бележка. Малкият жест се помни – и купувачът се връща отново.",
  },
  {
    icon: RefreshCw,
    title: "Освежавай обявата",
    text: "Продуктът не тръгва? Смени корицата, допиши описанието или намали малко цената. Можеш да редактираш обявата по всяко време от „Моите обяви“.",
  },
];

// How much of the price in the shop a listing usually asks for, by how much of the product is left.
const priceGuide = [
  { condition: "Запечатан, с опаковка", share: "60–80%", width: "w-4/5" },
  { condition: "Отварян, тестван 1–2 пъти", share: "50–60%", width: "w-3/5" },
  { condition: "Използван, над половината", share: "30–50%", width: "w-2/5" },
  { condition: "Използван, под половината", share: "до 30%", width: "w-1/5" },
];

const dos = [
  "Посочвай срока на годност и датата на отваряне.",
  "Споменавай, ако продуктът е бил на слънце или на топло.",
  "Уточнявай доставката и плащането в съобщенията, преди да изпратиш.",
  "Пази разписката от куриера, докато купувачът получи пратката.",
];

const donts = [
  "Не използвай чужди или рекламни снимки.",
  "Не скривай драскотини, липсващи капачки или изтекъл срок.",
  "Не продавай продукти с изтекъл срок на годност като годни.",
  "Не прехвърляй разговора на непознати сайтове и линкове.",
];

export default function SellingTipsPage() {
  return (
    <main className="flex flex-col flex-1 bg-zinc-50 font-sans">
      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
        <article className="text-base leading-7 text-brand-ink/80">
          <header>
            <span className="flex size-12 items-center justify-center rounded-full bg-brand-rose/10 text-brand-rose">
              <Lightbulb className="size-6" aria-hidden />
            </span>
            <h1 className="mt-5 text-2xl leading-tight font-bold text-brand-ink sm:text-3xl">
              Съвети за успешна продажба
            </h1>
            <p className="mt-4">
              Всяка обява е малка история – за продукт, който заслужава втори шанс. Ето как да я разкажеш така, че да
              стигне до правилния човек и то бързо.
            </p>
          </header>

          <ul className="mt-10 grid gap-4 sm:grid-cols-2">
            {tips.map(({ icon: Icon, title, text }, index) => (
              <li key={title} className="relative overflow-hidden rounded-2xl border border-black/5 bg-white p-6">
                {/* The tip's number, large and faint in the corner. */}
                <span
                  aria-hidden
                  className="absolute -top-3 right-3 text-7xl leading-none font-bold text-brand-rose/10 select-none"
                >
                  {index + 1}
                </span>
                <span className="relative flex size-10 items-center justify-center rounded-full bg-brand-rose/10 text-brand-rose">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h2 className="relative mt-4 font-bold text-brand-ink">{title}</h2>
                <p className="relative mt-1 text-sm leading-6">{text}</p>
              </li>
            ))}
          </ul>

          <section className="mt-14">
            <h2 className="text-xl font-bold text-brand-ink sm:text-2xl">Колко да поискам?</h2>
            <p className="mt-2 text-brand-ink/60">
              Ориентир от цената в магазина според това колко от продукта е останало. Нишовите парфюми и лимитираните
              издания често се продават и по-скъпо.
            </p>
            <ul className="mt-6 space-y-4 rounded-2xl border border-black/5 bg-white p-5 sm:p-6">
              {priceGuide.map(({ condition, share, width }) => (
                <li key={condition}>
                  <div className="flex items-baseline justify-between gap-4 text-sm">
                    <span className="font-medium text-brand-ink">{condition}</span>
                    <span className="font-bold whitespace-nowrap text-brand-rose">{share}</span>
                  </div>
                  <div aria-hidden className="mt-2 h-2 rounded-full bg-brand-rose/10">
                    <div className={`h-full rounded-full bg-brand-rose ${width}`} />
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-14 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-emerald-50 p-5 sm:p-6">
              <h2 className="flex items-center gap-2 font-bold text-emerald-800">
                <CircleCheck className="size-5" aria-hidden />
                Добре е да
              </h2>
              <ul className="mt-4 space-y-3 text-sm leading-6">
                {dos.map((item) => (
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
                По-добре недей
              </h2>
              <ul className="mt-4 space-y-3 text-sm leading-6">
                {donts.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-red-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <aside className="mt-10 flex gap-3 rounded-2xl bg-brand-rose/10 p-5">
            <Clock className="mt-1 size-5 shrink-0 text-brand-rose" aria-hidden />
            <div>
              <h3 className="font-bold text-brand-ink">Тайната на бързата продажба</h3>
              <p className="mt-1">
                Публикувай вечер или през уикенда – тогава повечето хора разглеждат спокойно. И отбележи всички
                начини на изпращане, които са ти удобни: колкото повече избор има купувачът, толкова по-лесно казва
                „да“.
              </p>
            </div>
          </aside>

          <figure className="mt-14 text-center">
            <HeartHandshake className="mx-auto size-8 text-brand-rose" aria-hidden />
            <blockquote className="mt-4 text-lg font-bold text-brand-ink sm:text-xl">
              „Най-добрата обява е тази, след която купувачът иска да пазарува от теб отново.“
            </blockquote>
          </figure>

          <div className="mt-14 flex flex-col items-center gap-4 rounded-3xl bg-brand-ink px-6 py-10 text-center">
            <p className="text-xl font-bold text-white sm:text-2xl">Време е за първата ти продажба</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/sell"
                className="group inline-flex items-center gap-2 rounded-full bg-brand-rose px-6 py-3 font-semibold text-white transition-colors hover:bg-brand"
              >
                Публикувай обява
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
              </Link>
              <Link
                href="/help/how-to-post"
                className="inline-flex items-center rounded-full px-6 py-3 font-semibold text-brand-pale ring-1 ring-white/20 transition-colors hover:bg-white/10"
              >
                Как да публикуваме обява
              </Link>
            </div>
          </div>
        </article>
      </div>
    </main>
  );
}
