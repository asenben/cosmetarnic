import type { Metadata } from "next";
import {
  Eye,
  Flag,
  Link2Off,
  MessageCircle,
  PackageOpen,
  ShieldAlert,
  ShieldCheck,
  Star,
  type LucideIcon,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Безопасно пазаруване",
};

type Rule = {
  icon: LucideIcon;
  title: string;
  text: string;
};

const rules: Rule[] = [
  {
    icon: MessageCircle,
    title: "Говорете в платформата",
    text: "Пиши чрез съобщенията на Козметарник. Така разговорът остава запазен, ако някога потрябва.",
  },
  {
    icon: Star,
    title: "Разгледай профила",
    text: "Виж профила и другите обяви на продавача. Активен профил с история вдъхва повече доверие.",
  },
  {
    icon: Eye,
    title: "Поискай още снимки",
    text: "Помоли за снимка на етикета, партидния номер или срока на годност. Честният продавач с радост ще ги изпрати.",
  },
  {
    icon: PackageOpen,
    title: "Провери пратката",
    text: "Където е възможно, избирай преглед преди плащане или наложен платеж и отвори пратката пред куриера.",
  },
];

// Signs that someone is not who they say they are.
const redFlags = [
  "Цена, твърде добра, за да е истина – особено за луксозни марки.",
  "Настояване да платиш предварително, бързо и „само днес“.",
  "Линкове към непознати сайтове за „плащане“ или „потвърждение на доставка“.",
  "Молба за данни на карта, пароли или кодове от SMS.",
  "Отказ да изпрати реална снимка на продукта.",
];

export default function SafetyPage() {
  return (
    <main className="flex flex-col flex-1 bg-zinc-50 font-sans">
      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
        <article className="text-base leading-7 text-brand-ink/80">
          <span className="flex size-12 items-center justify-center rounded-full bg-brand-rose/10 text-brand-rose">
            <ShieldCheck className="size-6" aria-hidden />
          </span>
          <h1 className="mt-5 text-2xl leading-tight font-bold text-brand-ink sm:text-3xl">Безопасно пазаруване</h1>
          <p className="mt-4">
            Повечето хора тук просто искат любимият им продукт да намери нов дом. Няколко прости навика ще те пазят
            и от редките изключения.
          </p>

          <ul className="mt-10 grid gap-4 sm:grid-cols-2">
            {rules.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4 rounded-2xl border border-black/5 bg-white p-5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-rose/10 text-brand-rose">
                  <Icon className="size-5" aria-hidden />
                </span>
                <div>
                  <h2 className="font-bold text-brand-ink">{title}</h2>
                  <p className="mt-1 text-sm leading-6">{text}</p>
                </div>
              </li>
            ))}
          </ul>

          <section className="mt-14 rounded-2xl bg-red-50 p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-xl font-bold text-red-800">
              <ShieldAlert className="size-6" aria-hidden />
              Червени флагове
            </h2>
            <p className="mt-2 text-sm text-red-800/80">Ако видиш някое от тези, спри и не плащай.</p>
            <ul className="mt-4 space-y-3">
              {redFlags.map((item) => (
                <li key={item} className="flex gap-2">
                  <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-red-600" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <aside className="mt-10 flex gap-3 rounded-2xl border border-black/5 bg-white p-5">
            <Link2Off className="mt-1 size-5 shrink-0 text-brand-rose" aria-hidden />
            <p>
              Козметарник никога няма да ти поиска парола, данни на карта или код по съобщение или имейл.
            </p>
          </aside>

          <section className="mt-4 rounded-2xl bg-brand-rose/10 p-5 sm:p-6">
            <h2 className="flex items-center gap-2 font-bold text-brand-ink">
              <Flag className="size-5 text-brand-rose" aria-hidden />
              Бил си измамен от човек тук? Докладвай го
            </h2>
            <ol className="mt-5 space-y-5">
              <li className="flex gap-4">
                <span
                  aria-hidden
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-rose text-sm font-bold text-white"
                >
                  1
                </span>
                <div>
                  <h3 className="font-bold text-brand-ink">
                    <span className="sr-only">1. </span>
                    На администраторите на Козметарник
                  </h3>
                  <p className="mt-1">
                    Използвай „Докладвай“ в обявата. Администратор ще прегледа сигнала и ще предприеме мерки срещу
                    измамно или грубо поведение.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span
                  aria-hidden
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-rose text-sm font-bold text-white"
                >
                  2
                </span>
                <div>
                  <h3 className="font-bold text-brand-ink">
                    <span className="sr-only">2. </span>
                    В Некоректен
                  </h3>
                  <p className="mt-1">
                    Подай сигнал и в{" "}
                    <a
                      href="https://nekorekten.com/"
                      target="_blank"
                      rel="noopener"
                      className="font-semibold text-brand-rose hover:underline"
                    >
                      nekorekten.com
                    </a>
                    , за да предупредиш и други купувачи извън платформата.
                  </p>
                </div>
              </li>
            </ol>
          </section>
        </article>
      </div>
    </main>
  );
}
