import type { Metadata } from "next";
import { ScrollText } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { getListingFee } from "@/lib/payments/canCreateListing";

export const metadata: Metadata = {
  title: "Terms",
};

const ordinals: Record<number, string> = { 1: "първата", 2: "втората", 3: "третата", 4: "четвъртата", 5: "петата" };

// The first right is the free listings, with the number and the price set in "Плащания".
const otherRights = [
  "Всеки посетител може да разглежда и търси обяви, без да има създаден профил. За да изпраща съобщения до продавача обаче, ще му бъде необходим профил.",
  "Личните Ви данни се пазят съгласно регламента за защита на личните данни (ЗЗЛД).",
];

const restrictions = [
  "В сайта могат да се качват само обяви за козметика, бижута и парфюми.",
  "Не се допускат обяви от типа на текстилни изделия или домашни потреби. Изключение в категория „Електроника“ правят разкрасителните уреди.",
  "При всяко качване на обява, която няма общо с козметика или с разрешените за продажба артикули в сайта, потребителят ще получава имейл, че обявата му не е свързана с козметика, както и известие колко предупреждения му остават до изключване. При три качвания на обява, която няма нищо общо с козметика, потребителят ще бъде изтрит. По преценка на администратор толерансът може да бъде увеличен. Ако имате притеснения, че профилът Ви ще бъде изтрит, можете да се свържете с администратор, за да изясните ситуацията и случаят да бъде разгледан.",
  "Не се допуска спам, а изпращането на спам съобщения отново подлежи на бан.",
  "За да запазим добрия тон на комуникация, сме създали функционалност „Докладвай потребител“, чрез която потребителите, притеснени от измамно или грубо поведение, като например обиди от страна на продавач, могат да го докладват.",
];

const sectionTitle = "mt-10 text-xl font-bold text-brand-ink";
const note = "text-brand-ink/60";
const list =
  "mt-4 list-decimal space-y-4 pl-6 marker:font-semibold marker:text-brand-rose";

export default async function TermsPage() {
  const { freeListings, price } = await getListingFee();
  const rights = [
    `Всеки потребител има право да качва до ${freeListings} безплатни обяви. След ${ordinals[freeListings] ?? `${freeListings}-ата`} обява се заплащат ${formatPrice(price)} за всяка допълнителна обява.`,
    ...otherRights,
  ];

  return (
    <main className="flex flex-col flex-1 bg-zinc-50 font-sans">
      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
        <article className="text-base leading-7 text-brand-ink/80">
          <span className="flex size-12 items-center justify-center rounded-full bg-brand-rose/10 text-brand-rose">
            <ScrollText className="size-6" aria-hidden />
          </span>
          <h1 className="mt-5 text-2xl leading-tight font-bold text-brand-ink sm:text-3xl">Правила на Козметарник</h1>
          <p className={`mt-3 ${note}`}>
            Правилата са създадени в полза на честните потребители и за да поддържаме полезен и спокоен сайт.
          </p>

          <h2 className={sectionTitle}>Права</h2>
          <ol className={list}>
            {rights.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ol>

          <h2 className={sectionTitle}>Ограничения</h2>
          <p className={`mt-2 ${note}`}>
            Не целим да правим правилата ограничаващи, а да бъдат в полза на нашите честни потребители.
          </p>
          <ol className={list}>
            {restrictions.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ol>

          <p className={`mt-10 ${note}`}>
            Не целим да правим правилата ограничаващи, а да бъдат в полза на нашите честни потребители.
          </p>
        </article>
      </div>
    </main>
  );
}
