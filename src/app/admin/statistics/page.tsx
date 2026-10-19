import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdmin } from "@/lib/admin";
import { getDailyVisits } from "@/lib/stats";

export const metadata: Metadata = {
  title: "Статистика",
};

const DAYS = 30;

const card = "rounded-2xl border border-black/5 bg-white p-5 sm:p-6";
const numberFormat = new Intl.NumberFormat("bg-BG");
// The days come as YYYY-MM-DD; noon UTC keeps them on the same date in any time zone.
const toDate = (day: string) => new Date(`${day}T12:00:00Z`);
const longDate = new Intl.DateTimeFormat("bg-BG", { weekday: "short", day: "numeric", month: "long" });
const shortDate = new Intl.DateTimeFormat("bg-BG", { day: "numeric", month: "short" });

const people = (count: number) => `${numberFormat.format(count)} ${count === 1 ? "посетител" : "посетители"}`;

// How many people opened the site on each of the last 30 days. A person is a device a day: one
// who comes back on another day is counted again that day. Administrators and robots are left out.
export default async function AdminStatistics() {
  if (!(await getAdmin())) notFound();
  const days = await getDailyVisits(DAYS);

  const today = days[days.length - 1];
  const yesterday = days[days.length - 2];
  const sum = (list: typeof days) => list.reduce((total, { visitors }) => total + visitors, 0);
  const week = sum(days.slice(-7));
  const month = sum(days);
  const max = Math.max(1, ...days.map(({ visitors }) => visitors));

  const tiles = [
    { label: "Днес", value: today.visitors, note: `${numberFormat.format(today.views)} отворени страници` },
    { label: "Вчера", value: yesterday.visitors, note: `${numberFormat.format(yesterday.views)} отворени страници` },
    { label: "Последните 7 дни", value: week, note: `средно ${numberFormat.format(Math.round(week / 7))} на ден` },
    { label: `Последните ${DAYS} дни`, value: month, note: `средно ${numberFormat.format(Math.round(month / DAYS))} на ден` },
  ];

  return (
    <div className="space-y-4">
      <section className={card}>
        <h1 className="text-2xl font-bold text-brand-ink sm:text-3xl">Статистика</h1>
        <p className="mt-1 text-sm text-brand-ink/60">
          Колко хора са разгледали сайта на ден. Всяко устройство се брои веднъж на ден, колкото и страници да отвори.
          Администраторите и роботите на търсачките не се броят.
        </p>

        <dl className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {tiles.map(({ label, value, note }) => (
            <div key={label} className="rounded-xl bg-zinc-50 p-4">
              <dt className="text-xs font-semibold tracking-wider text-brand-ink/60 uppercase">{label}</dt>
              <dd className="mt-1 text-3xl font-bold text-brand-ink tabular-nums">{numberFormat.format(value)}</dd>
              <dd className="mt-0.5 text-xs text-brand-ink/60">{note}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={card}>
        <h2 className="text-xl font-bold text-brand-ink">Посетители по дни</h2>
        <p className="mt-1 text-sm text-brand-ink/60">Последните {DAYS} дни. Задръж върху стълб, за да видиш деня.</p>

        {/* One bar a day, today on the right; the busiest day reaches the top. */}
        <div className="mt-6 flex h-56 items-end gap-0.5 border-b border-black/10 sm:gap-1">
          {days.map(({ day, visitors, views }) => {
            const label = `${longDate.format(toDate(day))}: ${people(visitors)}, ${numberFormat.format(views)} отворени страници`;
            return (
              <div
                key={day}
                tabIndex={0}
                aria-label={label}
                className="group relative flex h-full min-w-0 flex-1 cursor-default items-end outline-none"
              >
                <div
                  className={`w-full rounded-t-sm transition-colors ${
                    day === today.day ? "bg-brand" : "bg-brand-rose"
                  } group-hover:bg-brand group-focus-visible:bg-brand`}
                  // At least a sliver, so a day with visitors never looks like one without.
                  style={{ height: visitors > 0 ? `max(${(visitors / max) * 100}%, 3px)` : "0" }}
                />
                <div
                  aria-hidden
                  className="pointer-events-none invisible absolute bottom-full left-1/2 z-10 mb-2 w-max max-w-48 -translate-x-1/2 rounded-lg bg-brand-ink px-2.5 py-1.5 text-xs text-white shadow-lg group-hover:visible group-focus-visible:visible"
                >
                  <p className="font-semibold">{longDate.format(toDate(day))}</p>
                  <p className="mt-0.5 text-white/80">{people(visitors)}</p>
                  <p className="text-white/60">{numberFormat.format(views)} страници</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex justify-between text-xs text-brand-ink/60" aria-hidden>
          <span>{shortDate.format(toDate(days[0].day))}</span>
          <span>{shortDate.format(toDate(days[Math.floor(days.length / 2)].day))}</span>
          <span>Днес</span>
        </div>

        {/* The same numbers as a table, newest first. */}
        <details className="mt-6">
          <summary className="cursor-pointer text-sm font-semibold text-brand-rose">Покажи като таблица</summary>
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="border-b border-black/10 text-left text-xs text-brand-ink/60">
                <th className="py-2 font-semibold">Ден</th>
                <th className="py-2 text-right font-semibold">Посетители</th>
                <th className="py-2 text-right font-semibold">Страници</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {[...days].reverse().map(({ day, visitors, views }) => (
                <tr key={day}>
                  <td className="py-2 text-brand-ink">{longDate.format(toDate(day))}</td>
                  <td className="py-2 text-right font-semibold text-brand-ink tabular-nums">{numberFormat.format(visitors)}</td>
                  <td className="py-2 text-right text-brand-ink/60 tabular-nums">{numberFormat.format(views)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </section>
    </div>
  );
}
