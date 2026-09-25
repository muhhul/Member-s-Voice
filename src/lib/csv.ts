import { categoryLabel } from "@/lib/constants";
import { formatDateJakarta } from "@/lib/format";

const HEADER = ["Tanggal", "Kategori", "Pesan"];

/** Characters a spreadsheet treats as the start of a formula. */
const FORMULA_START = /^[=+\-@\t\r]/;
const NEEDS_QUOTING = /["\n\r,]/;

/**
 * Escapes one CSV cell.
 *
 * The leading-character check is not cosmetic: a spreadsheet treats a cell
 * starting with = + - or @ as a formula, so a submitted message beginning with
 * one of those would execute when a manager opens the export. Prefixing an
 * apostrophe forces it to stay text.
 */
export function escapeCsvCell(value: string): string {
  const neutralised = FORMULA_START.test(value) ? "'" + value : value;
  return NEEDS_QUOTING.test(neutralised)
    ? '"' + neutralised.replace(/"/g, '""') + '"'
    : neutralised;
}

/**
 * ANONYMITY REQUIREMENT: the first column is the date alone. Never add a time
 * column, and never widen this beyond these three fields.
 */
export function buildVoicesCsv(
  rows: { createdAt: Date; category: string; message: string }[],
): string {
  const lines = [HEADER.join(",")];

  for (const row of rows) {
    lines.push(
      [
        escapeCsvCell(formatDateJakarta(row.createdAt)),
        escapeCsvCell(categoryLabel(row.category)),
        escapeCsvCell(row.message),
      ].join(","),
    );
  }

  // The BOM is what makes Excel on Windows read this as UTF-8.
  return "﻿" + lines.join("\r\n") + "\r\n";
}
