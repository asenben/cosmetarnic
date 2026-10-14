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
  Lock,
  Recycle,
  ScrollText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

// The little stars around the motto: where each sits, how big it is, and when it starts to
// flicker, so they light up one after another instead of all at once.
const stars = [
  { className: "-top-2 left-0 size-3 text-brand-pastel", delay: "0s" },
  { className: "top-1 -right-1 size-2.5 text-white", delay: "0.6s" },
  { className: "-bottom-2 left-1/4 size-2 text-brand-lilac", delay: "1.2s" },
  { className: "-bottom-1 right-1/5 size-3 text-brand-pastel", delay: "1.8s" },
  { className: "-top-3 left-3/5 size-2 text-white", delay: "0.9s" },
];

// A four-pointed star like the one in the logo.
function Star({ className, delay }: { className: string; delay: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ animationDelay: delay }}
      className={`absolute animate-twinkle motion-reduce:animate-none ${className}`}
    >
      <path d="M12 0c.6 6.2 5.8 11.4 12 12-6.2.6-11.4 5.8-12 12-.6-6.2-5.8-11.4-12-12C6.2 11.4 11.4 6.2 12 0Z" />
    </svg>
  );
}

const columns = [
  {
    title: "Купувай",
    links: [
      { href: "/", label: "Всички обяви", icon: LayoutGrid },
      { href: "/?condition=new", label: "Нови", icon: Sparkles },
      { href: "/?condition=used", label: "Използвани", icon: Recycle },
      { href: "/terms", label: "Правила и условия", icon: ScrollText },
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
      { href: "/privacy", label: "Политика за поверителност", icon: Lock },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-footer text-sm text-white/70">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-[1fr_auto_auto_auto] lg:gap-x-20">
        {/* The logo, larger, with the motto under it, both centred in their column. */}
        <div className="flex flex-col items-center text-center">
          <Link href="/" aria-label="Начало" className="inline-block">
            <Image
              src="/images/logo.svg"
              alt="Cosmetarnic"
              width={64}
              height={64}
              className="size-16 rounded-full object-cover"
            />
          </Link>
          {/* The motto with stars flickering around it and a light running across its words. */}
          <p className="relative mt-5 px-4 leading-7">
            {stars.map((star) => (
              <Star key={star.className} {...star} />
            ))}
            <span className="animate-shimmer bg-linear-to-r from-brand-pale via-white to-brand-pale bg-size-[200%_auto] bg-clip-text font-medium text-transparent motion-reduce:animate-none">
              Козметарник - продавалник за козметика
            </span>
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
        {/* The copyright on one line, small enough to fit a phone, and the language under it;
            side by side on wide screens. */}
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 text-xs sm:px-6 md:flex-row md:items-center md:justify-between">
          <p className="text-[0.625rem] whitespace-nowrap min-[400px]:text-[0.6875rem] sm:text-xs">
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
          <span className="inline-flex items-center gap-2 self-center">
            <svg viewBox="0 0 20 14" className="h-3.5 w-5 rounded-xs" aria-hidden>
              <rect width="20" height="14" fill="#fff" />
              <rect y="4.67" width="20" height="4.67" fill="#00966e" />
              <rect y="9.33" width="20" height="4.67" fill="#d62612" />
            </svg>
            Български
          </span>
        </div>
      </div>
    </footer>
  );
}
