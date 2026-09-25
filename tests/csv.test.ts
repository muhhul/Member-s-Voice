import { describe, expect, it } from "vitest";
import { buildVoicesCsv, escapeCsvCell } from "@/lib/csv";

const BOM = "﻿";
const CRLF = "\r\n";

describe("escapeCsvCell", () => {
  it("leaves plain text unquoted", () => {
    expect(escapeCsvCell("Keselamatan")).toBe("Keselamatan");
  });

  it("quotes a value containing a comma", () => {
    expect(escapeCsvCell("a,b")).toBe('"a,b"');
  });

  it("quotes a value containing a newline", () => {
    expect(escapeCsvCell("baris satu\nbaris dua")).toBe('"baris satu\nbaris dua"');
  });

  it("doubles an embedded double quote", () => {
    expect(escapeCsvCell('dia bilang "aman"')).toBe('"dia bilang ""aman"""');
  });

  it("neutralises a leading equals sign so spreadsheets do not run it", () => {
    expect(escapeCsvCell("=1+1")).toBe("'=1+1");
  });

  it("neutralises leading plus, minus and at signs", () => {
    expect(escapeCsvCell("+1")).toBe("'+1");
    expect(escapeCsvCell("-1")).toBe("'-1");
    expect(escapeCsvCell("@SUM(A1)")).toBe("'@SUM(A1)");
  });

  it("quotes a neutralised value that also contains a comma", () => {
    expect(escapeCsvCell("=1,2")).toBe("\"'=1,2\"");
  });

  it("does not touch an equals sign that is not leading", () => {
    expect(escapeCsvCell("total = 5")).toBe("total = 5");
  });
});

describe("buildVoicesCsv", () => {
  const rows = [
    {
      createdAt: new Date("2026-03-15T04:00:00Z"),
      category: "safety",
      message: "Lantai licin",
    },
    {
      createdAt: new Date("2026-03-14T04:00:00Z"),
      category: "facility_improvement",
      message: "Dispenser, tidak dingin",
    },
  ];

  it("starts with a UTF-8 BOM so Excel reads Indonesian text correctly", () => {
    expect(buildVoicesCsv(rows).startsWith(BOM)).toBe(true);
  });

  it("uses an Indonesian header row", () => {
    const lines = buildVoicesCsv(rows).replace(BOM, "").split(CRLF);
    expect(lines[0]).toBe("Tanggal,Kategori,Pesan");
  });

  it("renders the date only, never a time", () => {
    const lines = buildVoicesCsv(rows).replace(BOM, "").split(CRLF);
    expect(lines[1].startsWith("2026-03-15,")).toBe(true);
    expect(lines[1]).not.toMatch(/\d{2}:\d{2}/);
  });

  it("uses the Indonesian category label", () => {
    expect(buildVoicesCsv(rows)).toContain("Keselamatan (K3)");
  });

  it("quotes a message containing a comma", () => {
    expect(buildVoicesCsv(rows)).toContain('"Dispenser, tidak dingin"');
  });

  it("returns just the header for an empty result", () => {
    expect(buildVoicesCsv([])).toBe(BOM + "Tanggal,Kategori,Pesan" + CRLF);
  });

  it("emits one line per row plus the header", () => {
    const lines = buildVoicesCsv(rows).replace(BOM, "").trimEnd().split(CRLF);
    expect(lines).toHaveLength(3);
  });
});
