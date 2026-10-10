import { sql } from "@/lib/db";

// Reports ("сигнали"): a signed-in user pressing "Докладвай" on a listing's page tells the
// administrator that something is wrong with it. The administrator reads them in the panel.

// The reasons the form offers, by the value that is stored.
export const reportReasons = [
  { value: "fake", label: "Фалшив или неоригинален продукт" },
  { value: "scam", label: "Измама или подвеждаща обява" },
  { value: "inappropriate", label: "Неподходящо съдържание" },
  { value: "category", label: "Грешна категория" },
  { value: "duplicate", label: "Повторена обява" },
  { value: "other", label: "Друго" },
] as const;

export const REPORT_DETAILS_MAX = 500;

const ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ReportResult = { ok: true } | { ok: false; status: 400 | 404 | 409; message: string };

export async function createReport(userId: string, listingId: string, input: Record<string, unknown>): Promise<ReportResult> {
  if (!ID_PATTERN.test(listingId)) return { ok: false, status: 404, message: "Обявата не е намерена." };
  const reason = typeof input.reason === "string" ? input.reason : "";
  const details = (typeof input.details === "string" ? input.details : "").trim();
  if (!reportReasons.some(({ value }) => value === reason)) {
    return { ok: false, status: 400, message: "Избери причина." };
  }
  if (details.length > REPORT_DETAILS_MAX) {
    return { ok: false, status: 400, message: `Описанието трябва да е до ${REPORT_DETAILS_MAX} знака.` };
  }
  // "Друго" says nothing by itself, so it has to be explained.
  if (reason === "other" && details.length < 5) {
    return { ok: false, status: 400, message: "Опиши накратко какъв е проблемът." };
  }

  const [listing] = await sql`select user_id, title, number from listings where id = ${listingId}`;
  if (!listing) return { ok: false, status: 404, message: "Обявата не е намерена." };
  if (listing.user_id === userId) return { ok: false, status: 400, message: "Това е твоя обява." };

  // One report per person per listing is enough while it is waiting to be looked at.
  const [waiting] = await sql`
    select 1 from reports where listing_id = ${listingId} and reporter_id = ${userId} and status = 'open' limit 1`;
  if (waiting) return { ok: false, status: 409, message: "Вече си докладвал тази обява. Сигналът ти чака преглед." };

  await sql`
    insert into reports (listing_id, listing_title, listing_number, seller_id, reporter_id, reason, details)
    values (${listingId}, ${listing.title}, ${listing.number}, ${listing.user_id}, ${userId}, ${reason}, ${details || null})`;
  return { ok: true };
}

// A report as the administrator's list shows it. The listing, the seller and the reporter may
// have been deleted since; what was written down at the time stays.
export type Report = {
  id: string;
  reason: string;
  details: string;
  status: "open" | "resolved";
  createdAt: Date;
  listing: { id: string | null; title: string; number: number | null };
  seller: { id: string; username: string } | null;
  reporter: { id: string; username: string } | null;
};

// Every report, the ones still waiting first, and the newest first among each.
export async function listReports(): Promise<Report[]> {
  const rows = await sql`
    select r.id, r.reason, r.details, r.status, r.created_at, r.listing_id, r.listing_title, r.listing_number,
           r.seller_id, s.username as seller_username, r.reporter_id, p.username as reporter_username
    from reports r
    left join users s on s.id = r.seller_id
    left join users p on p.id = r.reporter_id
    order by (r.status = 'open') desc, r.created_at desc`;
  return rows.map((row) => ({
    id: row.id,
    reason: reportReasons.find(({ value }) => value === row.reason)?.label ?? row.reason,
    details: row.details ?? "",
    status: row.status === "resolved" ? "resolved" : "open",
    createdAt: new Date(row.created_at),
    listing: { id: row.listing_id, title: row.listing_title, number: row.listing_number === null ? null : Number(row.listing_number) },
    seller: row.seller_id && row.seller_username ? { id: row.seller_id, username: row.seller_username } : null,
    reporter: row.reporter_id && row.reporter_username ? { id: row.reporter_id, username: row.reporter_username } : null,
  }));
}

export async function countOpenReports() {
  const [row] = await sql`select count(*)::int as count from reports where status = 'open'`;
  return row.count as number;
}

// Marks a report as looked at, or as waiting again. Answers false when there is no such report.
export async function setReportResolved(id: string, resolved: boolean) {
  if (!ID_PATTERN.test(id)) return false;
  const changed = await sql`
    update reports
    set status = ${resolved ? "resolved" : "open"}, resolved_at = ${resolved ? new Date().toISOString() : null}
    where id = ${id} returning id`;
  return changed.length > 0;
}

export async function deleteReport(id: string) {
  if (!ID_PATTERN.test(id)) return false;
  const removed = await sql`delete from reports where id = ${id} returning id`;
  return removed.length > 0;
}
