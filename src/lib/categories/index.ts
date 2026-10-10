import { cache } from "react";
import { DEFAULT_CATEGORY_ICON, categoryIcons } from "@/data/categoryIcons";
import { sql } from "@/lib/db";

// The categories a listing or a "Търся" post can be in. They are kept in the database, so that
// the administrator can add to them from the panel.
export type Category = {
  // What is stored with a listing or a post, e.g. "makeup". Never changes once made.
  value: string;
  // What people see, e.g. "Грим".
  label: string;
  // The name of its picture (see src/data/categoryIcons.ts).
  icon: string;
};

// Every category in the order the site shows them. Asked once per request, however many parts
// of the page need it.
export const getCategories = cache(async (): Promise<Category[]> => {
  const rows = await sql`select value, label, icon from categories order by position, label`;
  return rows.map((row) => ({ value: row.value, label: row.label, icon: row.icon }));
});

// The categories with how much is published in each, for the administrator's list.
export async function getCategoryUsage() {
  const rows = await sql`
    select c.value, c.label, c.icon,
           (select count(*)::int from listings where category = c.value) as listings,
           (select count(*)::int from requests where category = c.value) as requests
    from categories c order by c.position, c.label`;
  return rows.map((row) => ({
    value: row.value as string,
    label: row.label as string,
    icon: row.icon as string,
    listings: row.listings as number,
    requests: row.requests as number,
  }));
}

const LATIN: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n",
  о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sht", ъ: "a",
  ь: "y", ю: "yu", я: "ya",
};

// "Грижа за тялото" becomes "grizha-za-tyaloto": the name in Latin letters, for the stored value.
const slug = (label: string) =>
  [...label.toLowerCase()]
    .map((letter) => LATIN[letter] ?? letter)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

export type CategoryResult = { ok: true } | { ok: false; message: string };

export async function addCategory(input: Record<string, unknown>): Promise<CategoryResult> {
  const label = (typeof input.label === "string" ? input.label : "").trim().replace(/\s+/g, " ");
  const icon = typeof input.icon === "string" && Object.hasOwn(categoryIcons, input.icon) ? input.icon : DEFAULT_CATEGORY_ICON;
  if (label.length < 2 || label.length > 40) return { ok: false, message: "Името трябва да е от 2 до 40 знака." };

  const [same] = await sql`select 1 from categories where lower(label) = lower(${label}) limit 1`;
  if (same) return { ok: false, message: "Вече има категория с това име." };

  // The value has to be new too; a number is added when another category already took it.
  const base = slug(label) || "category";
  const taken = new Set((await sql`select value from categories`).map((row) => row.value as string));
  let value = base;
  for (let n = 2; taken.has(value); n++) value = `${base}-${n}`;

  await sql`
    insert into categories (value, label, icon, position)
    values (${value}, ${label}, ${icon}, (select coalesce(max(position), 0) + 1 from categories))`;
  return { ok: true };
}

// Removes a category that nothing is published in. One that is in use stays, so that no
// listing or post is left without its category.
export async function deleteCategory(value: string): Promise<CategoryResult> {
  const [used] = await sql`
    select (select count(*)::int from listings where category = ${value}) +
           (select count(*)::int from requests where category = ${value}) as count`;
  if (used.count > 0) return { ok: false, message: "В тази категория има обяви или публикации и не може да се изтрие." };
  const removed = await sql`delete from categories where value = ${value} returning value`;
  return removed.length > 0 ? { ok: true } : { ok: false, message: "Категорията не е намерена." };
}

// Changes a category's name or picture. Its stored value stays the same, so everything already
// published in it stays in it.
export async function updateCategory(value: string, input: Record<string, unknown>): Promise<CategoryResult> {
  const label = (typeof input.label === "string" ? input.label : "").trim().replace(/\s+/g, " ");
  const icon = typeof input.icon === "string" && Object.hasOwn(categoryIcons, input.icon) ? input.icon : null;
  if (label.length < 2 || label.length > 40) return { ok: false, message: "Името трябва да е от 2 до 40 знака." };
  if (!icon) return { ok: false, message: "Избери икона от предложените." };

  const [same] = await sql`select 1 from categories where lower(label) = lower(${label}) and value <> ${value} limit 1`;
  if (same) return { ok: false, message: "Вече има категория с това име." };

  const changed = await sql`update categories set label = ${label}, icon = ${icon} where value = ${value} returning value`;
  return changed.length > 0 ? { ok: true } : { ok: false, message: "Категорията не е намерена." };
}

// Moves a category one place up or down in the order the site shows them.
export async function moveCategory(value: string, direction: unknown): Promise<CategoryResult> {
  if (direction !== "up" && direction !== "down") return { ok: false, message: "Невалидна заявка." };
  const order = (await sql`select value from categories order by position, label`).map((row) => row.value as string);
  const from = order.indexOf(value);
  if (from < 0) return { ok: false, message: "Категорията не е намерена." };
  const to = from + (direction === "up" ? -1 : 1);
  // Already first or last: there is nowhere to move it, which is not an error.
  if (to < 0 || to >= order.length) return { ok: true };

  [order[from], order[to]] = [order[to], order[from]];
  // Every place is written afresh, so the order stays clean whatever the places were before.
  await sql`
    update categories c set position = placed.position
    from unnest(${order}::text[]) with ordinality as placed (value, position)
    where c.value = placed.value`;
  return { ok: true };
}
