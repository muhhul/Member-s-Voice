import { buildVoicesCsv } from "@/lib/csv";
import { formatDateJakarta } from "@/lib/format";
import { listVoicesForExport } from "@/lib/queries";
import { getAuthorizedUser } from "@/lib/session";
import { filtersSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // A route handler answers with a status code rather than a redirect, so it
  // uses getAuthorizedUser instead of requireRole. The database re-check still
  // happens - middleware alone is not the authorization.
  const user = await getAuthorizedUser(["master", "viewer"]);
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const params = new URL(request.url).searchParams;
  const filters = filtersSchema.parse({
    category: params.get("category") ?? undefined,
    from: params.get("from") ?? undefined,
    to: params.get("to") ?? undefined,
    q: params.get("q") ?? undefined,
    page: params.get("page") ?? undefined,
  });

  const rows = await listVoicesForExport(filters);
  const filename = `members-voice-${formatDateJakarta(new Date())}.csv`;

  return new Response(buildVoicesCsv(rows), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}
