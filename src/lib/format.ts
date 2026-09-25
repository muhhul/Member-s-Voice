const TIME_ZONE = "Asia/Jakarta";

/** en-CA renders as YYYY-MM-DD, which is what the dashboard and CSV both want. */
const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/**
 * ANONYMITY REQUIREMENT: date only. created_at keeps its full precision in the
 * database for sorting, and this is the only function allowed to render it.
 * Never format created_at with a time component anywhere in the UI or the CSV.
 */
export function formatDateJakarta(value: Date): string {
  return dateFormatter.format(value);
}

/** Midnight Jakarta time on the given YYYY-MM-DD, as an absolute instant. */
export function jakartaDayStart(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00+07:00`);
}

/**
 * Midnight Jakarta time on the following day, used as an exclusive upper bound
 * so a voice submitted at 23:30 on the "to" date is still included.
 */
export function jakartaDayEndExclusive(isoDate: string): Date {
  return new Date(jakartaDayStart(isoDate).getTime() + 86_400_000);
}
