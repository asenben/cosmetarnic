import Image from "next/image";
import Link from "next/link";
import {
  CircleHelp,
  CirclePlus,
  ClipboardList,
  CreditCard,
  Heart,
  LayoutGrid,
  Lightbulb,
  Recycle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const columns = [
  {
    title: "Купувай",
    links: [
      { href: "/listings", label: "Всички обяви", icon: LayoutGrid },
      { href: "/listings?condition=new", label: "Нови", icon: Sparkles },
      { href: "/listings?condition=used", label: "Използвани", icon: Recycle },
    ],
  },
  {
    title: "Продавай",
    links: [
      { href: "/help/how-to-post", label: "Как да публикуваме обява", icon: CirclePlus },
      { href: "/help/listing-rules", label: "Правила за обяви", icon: ClipboardList },
      { href: "/help/fees", label: "Такси и плащане", icon: CreditCard },
      { href: "/help/selling-tips", label: "Съвети за успешна продажба", icon: Lightbulb },
    ],
  },
  {
    title: "Полезно",
    links: [
      { href: "/about", label: "Мисията ни", icon: Heart },
      { href: "/faq", label: "Често задавани въпроси", icon: CircleHelp },
      { href: "/help/safety", label: "Безопасно пазаруване", icon: ShieldCheck },
    ],
  },
];

const legalLink = "transition-colors hover:text-white";

export default function Footer() {
  return (
    <footer className="bg-footer text-sm text-white/70">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-[1fr_auto_auto_auto] lg:gap-x-20">
        <div>
          <Link href="/" aria-label="Начало" className="inline-block">
            <Image
              src="/images/logo.svg"
              alt="Cosmetarnic"
              width={48}
              height={48}
              className="size-12 rounded-full object-cover"
            />
          </Link>
          <p className="mt-5 leading-7">
            Платформа за козметиката.
            <br />
            Купувай и Продавай продукти.
          </p>
        </div>

        {columns.map(({ title, links }) => (
          <nav key={title} aria-label={title}>
            <h2 className="text-xs font-bold tracking-wider text-brand-rose uppercase">{title}</h2>
            <ul className="mt-4 space-y-3">
              {links.map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <Link href={href} className="group inline-flex items-center gap-3 pr-6 text-brand-pale transition-[padding] duration-300 ease-out hover:pr-0 focus-visible:pr-0 motion-reduce:transition-none lg:whitespace-nowrap">
                    <span
                      aria-hidden
                      className="-mr-3 h-px w-0 bg-current transition-[width,margin] duration-300 ease-out group-hover:mr-0 group-hover:w-3 group-focus-visible:mr-0 group-focus-visible:w-3 motion-reduce:transition-none"
                    />
                    <Icon className="size-4 shrink-0" aria-hidden />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 text-xs sm:px-6 md:flex-row md:items-center md:justify-between">
          <p>
            © 2026 Козметарник.{" "}
            <a
              href="https://codenovastudio.com"
              target="_blank"
              rel="noopener"
              className="font-semibold text-brand-rose hover:underline"
            >
              CodeNova Studio
            </a>
            . Всички права запазени.
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link href="/terms" className={legalLink}>
              Правила и условия
            </Link>
            <span className="h-4 w-px bg-white/15" aria-hidden />
            <Link href="/privacy" className={legalLink}>
              Политика за поверителност
            </Link>
            <span className="h-4 w-px bg-white/15" aria-hidden />
            <span className="inline-flex items-center gap-2">
              <svg viewBox="0 0 20 14" className="h-3.5 w-5 rounded-xs" aria-hidden>
                <rect width="20" height="14" fill="#fff" />
                <rect y="4.67" width="20" height="4.67" fill="#00966e" />
                <rect y="9.33" width="20" height="4.67" fill="#d62612" />
              </svg>
              Български
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
