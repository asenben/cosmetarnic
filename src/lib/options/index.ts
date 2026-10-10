import { cache } from "react";
import { sql } from "@/lib/db";

// The parts of the search filters the administrator sets from the panel besides the categories:
// the towns that are offered, and the range of the price slider.

export type City = { id: string; name: string };
export type PriceRange = { min: number; max: number };

// Used until the administrator sets a range, and if the stored one is ever unusable.
const DEFAULT_PRICE_RANGE: PriceRange = { min: 0, max: 500 };
const PRICE_LIMIT = 100000;
const ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Every town in the order the site offers them. Asked once per request.
export const getCities = cache(async (): Promise<City[]> => {
  const rows = await sql`select id, name from cities order by position, name`;
  return rows.map((row) => ({ id: row.id, name: row.name }));
});

// The ends of the price slider in the filters. Its top end means "and above".
export const getPriceRange = cache(async (): Promise<PriceRange> => {
  const [row] = await sql`select value from settings where key = 'price_range'`;
  const min = Number(row?.value?.min);
  const max = Number(row?.value?.max);
  return Number.isFinite(min) && Number.isFinite(max) && min >= 0 && max > min ? { min, max } : DEFAULT_PRICE_RANGE;
});

export type OptionResult = { ok: true } | { ok: false; message: string };

const NO_CITY: OptionResult = { ok: false, message: "Градът не е намерен." };

function cityName(input: unknown): { name: string } | { message: string } {
  const name = (typeof input === "string" ? input : "").trim().replace(/\s+/g, " ");
  return name.length < 2 || name.length > 40 ? { message: "Името трябва да е от 2 до 40 знака." } : { name };
}

export async function addCity(input: unknown): Promise<OptionResult> {
  const checked = cityName(input);
  if ("message" in checked) return { ok: false, message: checked.message };

  const [same] = await sql`select 1 from cities where lower(name) = lower(${checked.name}) limit 1`;
  if (same) return { ok: false, message: "Този град вече е в списъка." };
  await sql`
    insert into cities (name, position)
    values (${checked.name}, (select coalesce(max(position), 0) + 1 from cities))`;
  return { ok: true };
}

// Changes how a town is written in the list. Listings and profiles that already name the town
// keep the name they were saved with.
export async function renameCity(id: string, input: unknown): Promise<OptionResult> {
  if (!ID_PATTERN.test(id)) return NO_CITY;
  const checked = cityName(input);
  if ("message" in checked) return { ok: false, message: checked.message };

  const [same] = await sql`select 1 from cities where lower(name) = lower(${checked.name}) and id <> ${id} limit 1`;
  if (same) return { ok: false, message: "Този град вече е в списъка." };
  const changed = await sql`update cities set name = ${checked.name} where id = ${id} returning id`;
  return changed.length > 0 ? { ok: true } : NO_CITY;
}

// Moves a town one place up or down in the order the site offers them.
export async function moveCity(id: string, direction: unknown): Promise<OptionResult> {
  if (direction !== "up" && direction !== "down") return { ok: false, message: "Невалидна заявка." };
  const order = (await sql`select id from cities order by position, name`).map((row) => row.id as string);
  const from = order.indexOf(id);
  if (from < 0) return NO_CITY;
  const to = from + (direction === "up" ? -1 : 1);
  // Already first or last: there is nowhere to move it, which is not an error.
  if (to < 0 || to >= order.length) return { ok: true };

  [order[from], order[to]] = [order[to], order[from]];
  await sql`
    update cities c set position = placed.position
    from unnest(${order}::uuid[]) with ordinality as placed (id, position)
    where c.id = placed.id`;
  return { ok: true };
}

// Takes a town out of the list that is offered. Whatever was published in it stays as it is.
export async function deleteCity(id: string): Promise<OptionResult> {
  if (!ID_PATTERN.test(id)) return NO_CITY;
  const removed = await sql`delete from cities where id = ${id} returning id`;
  return removed.length > 0 ? { ok: true } : NO_CITY;
}

export async function setPriceRange(input: Record<string, unknown>): Promise<OptionResult> {
  const min = Number(input.min);
  const max = Number(input.max);
  if (!Number.isInteger(min) || !Number.isInteger(max)) return { ok: false, message: "Въведи цели числа." };
  if (min < 0) return { ok: false, message: "Долната граница не може да е под 0." };
  if (max <= min) return { ok: false, message: "Горната граница трябва да е по-голяма от долната." };
  if (max > PRICE_LIMIT) return { ok: false, message: `Горната граница може да е най-много ${PRICE_LIMIT}.` };

  await sql`
    insert into settings (key, value) values ('price_range', ${JSON.stringify({ min, max })}::jsonb)
    on conflict (key) do update set value = excluded.value`;
  return { ok: true };
}
