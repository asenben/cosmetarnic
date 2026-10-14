import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Camera,
  CircleCheck,
  CirclePlus,
  Gift,
  Info,
  MessageCircle,
  PenLine,
  Rocket,
  Sun,
  Tag,
  Truck,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { MAX_LISTING_PHOTOS } from "@/lib/listings/images";

export const metadata: Metadata = {
  title: "Как да публикуваме обява",
};

type Step = {
  icon: LucideIcon;
  title: string;
  text: string;
  // A short reminder under the step, in the brand's colour.
  hint?: string;
};

const steps: Step[] = [
  {
    icon: UserRound,
    title: "Влез в профила си",
    text: "Обявите се публикуват от регистрирани потребители, за да знае купувачът с кого разговаря. Ако още нямаш профил, регистрацията отнема по-малко време, отколкото едно нанасяне на спирала.",
  },
  {
    icon: Camera,
    title: "Снимай продукта",
    text: `Добави до ${MAX_LISTING_PHOTOS} снимки във формат JPG, PNG или WebP, до 5 MB всяка. Първата снимка е корицата на обявата – тя се вижда в списъка с обяви, затова избери най-хубавата.`,
    hint: "Можеш просто да провлачиш снимките върху полето.",
  },
  {
    icon: PenLine,
    title: "Разкажи за него",
    text: "Дай на обявата кратко и ясно заглавие, а в описанието напиши поне няколко изречения: нюанс, срок на годност, колко е използван продуктът, защо се разделяш с него.",
    hint: "Добро заглавие: „Dior Rouge 999, използвано 2 пъти“.",
  },
  {
    icon: Tag,
    title: "Попълни подробностите",
    text: "Марка, категория, състояние (ново или използвано) и цвят, ако има значение. Така обявата ти ще излиза, когато някой филтрира точно това, което предлагаш.",
  },
  {
    icon: Gift,
    title: "Определи цена",
    text: "Сложи цена в евро или отбележи „Безплатно“, ако искаш просто продуктът да намери нов дом. Подаръкът също е втори живот.",
  },
  {
    icon: Truck,
    title: "Избери как да го изпратиш",
    text: "Лично предаване, Еконт, Спиди, BoxNow, Pigeon или друго – отбележи веднъж в „Моят профил“ всички начини, които са удобни за теб, заедно с телефона и града. Те важат за всичките ти обяви.",
  },
  {
    icon: Rocket,
    title: "Публикувай!",
    text: "Натисни „Публикувай обявата“ и тя веднага се появява в сайта – без чакане за одобрение. Можеш да я редактираш или изтриеш по всяко време от „Моите обяви“ в профила си.",
  },
];

const photoTips = [
  { icon: Sun, title: "Дневна светлина", text: "Снимай до прозорец. Естествената светлина показва истинския цвят на нюанса." },
  { icon: Camera, title: "Чист фон", text: "Бял лист, плот или кърпа – нищо, което да отвлича погледа от продукта." },
  { icon: CircleCheck, title: "Всички детайли", text: "Етикет, партиден номер, срок на годност и колко е останало в опаковката." },
];

const checklist = [
  "Снимките са ясни и показват реалното състояние на продукта.",
  "Заглавието казва какво продаваш с няколко думи.",
  "В описанието има срок на годност и колко е използван продуктът.",
  "Цената е честна – или е отбелязано „Безплатно“.",
  "Избрани са всички начини на изпращане, които ти подхождат.",
];

export default function HowToPostPage() {
  return (
    <main className="flex flex-col flex-1 bg-zinc-50 font-sans">
      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
        <article className="text-base leading-7 text-brand-ink/80">
          <header>
            <span className="flex size-12 items-center justify-center rounded-full bg-brand-rose/10 text-brand-rose">
              <CirclePlus className="size-6" aria-hidden />
            </span>
            <h1 className="mt-5 text-2xl leading-tight font-bold text-brand-ink sm:text-3xl">
              Как да публикуваме обява
            </h1>
            <p className="mt-4">
              Онзи хайлайтър, който блести по-добре на чужда скула. Серумът, който се оказа не за твоя тип кожа.
              Седем стъпки и няколко минути – и те вече чакат новия си собственик.
            </p>
          </header>

          {/* The steps as a timeline: a line down the side joins the icons of one step to the next. */}
          <ol className="mt-10">
            {steps.map(({ icon: Icon, title, text, hint }, index) => (
              <li key={title} className="relative flex gap-4 pb-8 last:pb-0">
                {index < steps.length - 1 && (
                  <span aria-hidden className="absolute top-12 bottom-0 left-6 w-px -translate-x-1/2 bg-brand-rose/20" />
                )}
                <span className="relative flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-rose text-white">
                  <Icon className="size-5" aria-hidden />
                  <span
                    aria-hidden
                    className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-white text-[0.6875rem] font-bold text-brand-rose ring-2 ring-brand-rose"
                  >
                    {index + 1}
                  </span>
                </span>
                <div className="pt-2.5">
                  <h2 className="font-bold text-brand-ink">
                    <span className="sr-only">{index + 1}. </span>
                    {title}
                  </h2>
                  <p className="mt-1">{text}</p>
                  {hint && <p className="mt-2 text-sm font-medium text-brand-rose">{hint}</p>}
                </div>
              </li>
            ))}
          </ol>

          <section className="mt-14">
            <h2 className="text-xl font-bold text-brand-ink sm:text-2xl">Снимка, която продава</h2>
            <p className="mt-2 text-brand-ink/60">Купувачът не може да докосне продукта – снимката го прави вместо него.</p>
            <ul className="mt-6 grid gap-4 sm:grid-cols-3">
              {photoTips.map(({ icon: Icon, title, text }) => (
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

          <section className="mt-14">
            <h2 className="text-xl font-bold text-brand-ink sm:text-2xl">Преди да натиснеш „Публикувай“</h2>
            <ul className="mt-6 space-y-3">
              {checklist.map((item) => (
                <li key={item} className="flex gap-3">
                  <CircleCheck className="mt-1 size-5 shrink-0 text-brand-rose" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <aside className="mt-10 flex gap-3 rounded-2xl bg-brand-rose/10 p-5">
            <MessageCircle className="mt-1 size-5 shrink-0 text-brand-rose" aria-hidden />
            <div>
              <h3 className="font-bold text-brand-ink">Какво следва?</h3>
              <p className="mt-1">
                Когато някой хареса продукта ти, ще ти пише чрез съобщенията в сайта. Отговаряй навреме и
                уточнете заедно плащането и доставката – сделката е изцяло между вас двамата.
              </p>
            </div>
          </aside>

          <aside className="mt-4 flex gap-3 rounded-2xl border border-black/5 bg-white p-5">
            <Info className="mt-1 size-5 shrink-0 text-brand-rose" aria-hidden />
            <p>
              Тук правилата са прости – козметика, всичко около нея и добро отношение към останалите. Подробностите
              ще намериш в{" "}
              <Link href="/help/listing-rules" className="font-semibold text-brand-rose hover:underline">
                Правила за обяви
              </Link>
              .
            </p>
          </aside>

          <div className="mt-14 flex flex-col items-center gap-4 rounded-3xl bg-brand-ink px-6 py-10 text-center">
            <p className="text-xl font-bold text-white sm:text-2xl">Готова ли е козметиката ти за втори живот?</p>
            <Link
              href="/sell"
              className="group inline-flex items-center gap-2 rounded-full bg-brand-rose px-6 py-3 font-semibold text-white transition-colors hover:bg-brand"
            >
              Публикувай обява
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
            </Link>
          </div>
        </article>
      </div>
    </main>
  );
}
