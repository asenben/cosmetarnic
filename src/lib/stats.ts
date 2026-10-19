import { sql } from "@/lib/db";

// Visits to the site, for "Статистика" in the administration. A device is told apart from another
// by its network address and browser, hashed together with the day, so the table holds no
// addresses and a device cannot be followed from one day to the next.

// Search engines and other robots, which open pages without anybody looking at them.
const BOT_PATTERN = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|curl|wget|python|node-fetch/i;

export const isBot = (userAgent: string) => !userAgent || BOT_PATTERN.test(userAgent);

// Counts one page opened by the device, on today's date in Bulgaria.
export async function recordVisit(address: string, userAgent: string) {
  await sql`
    with today as (select (now() at time zone 'Europe/Sofia')::date as day)
    insert into site_visits (day, visitor, views)
    select day, encode(sha256(convert_to(day::text || '|' || ${address} || '|' || ${userAgent}, 'UTF8')), 'hex'), 1
    from today
    on conflict (day, visitor) do update set views = site_visits.views + 1`;
}

export type DayVisits = {
  // The date as YYYY-MM-DD, in Bulgaria.
  day: string;
  // Devices that opened the site that day, and the pages they opened between them.
  visitors: number;
  views: number;
};

// The last `days` days, oldest first and today last, with 0 for days nobody came.
export async function getDailyVisits(days: number): Promise<DayVisits[]> {
  const rows = await sql`
    with range as (
      select generate_series(
        (now() at time zone 'Europe/Sofia')::date - ${days - 1}::int,
        (now() at time zone 'Europe/Sofia')::date,
        interval '1 day'
      )::date as day
    )
    select to_char(r.day, 'YYYY-MM-DD') as day,
           count(v.visitor)::int as visitors,
           coalesce(sum(v.views), 0)::int as views
    from range r left join site_visits v on v.day = r.day
    group by r.day order by r.day`;
  return rows.map((row) => ({ day: row.day as string, visitors: row.visitors as number, views: row.views as number }));
}
