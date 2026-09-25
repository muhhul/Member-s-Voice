import { z } from "zod";
import { CATEGORIES, MESSAGE_MAX, MESSAGE_MIN } from "@/lib/constants";

/** YYYY-MM-DD, as produced by <input type="date">. */
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const voiceSchema = z.object({
  category: z.enum(CATEGORIES, {
    errorMap: () => ({ message: "Pilih kategori terlebih dahulu." }),
  }),
  message: z
    .string()
    .trim()
    .min(MESSAGE_MIN, `Pesan minimal ${MESSAGE_MIN} karakter.`)
    .max(MESSAGE_MAX, `Pesan maksimal ${MESSAGE_MAX} karakter.`),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Format email tidak valid."),
  password: z.string().min(1, "Kata sandi wajib diisi."),
});

export const createUserSchema = z.object({
  email: z.string().trim().toLowerCase().email("Format email tidak valid."),
  name: z.string().trim().min(1, "Nama wajib diisi.").max(100, "Nama maksimal 100 karakter."),
  role: z.enum(["master", "viewer"], {
    errorMap: () => ({ message: "Peran tidak valid." }),
  }),
  password: z.string().min(12, "Kata sandi minimal 12 karakter."),
});

export const resetPasswordSchema = z.object({
  userId: z.string().uuid("Pengguna tidak valid."),
  password: z.string().min(12, "Kata sandi minimal 12 karakter."),
});

/**
 * Filters come from the query string, where anyone can type anything. A bad
 * value is dropped rather than raised, so the dashboard never 500s on a
 * hand-edited URL.
 */
export const filtersSchema = z.object({
  category: z.enum(CATEGORIES).optional().catch(undefined),
  from: isoDate.optional().catch(undefined),
  to: isoDate.optional().catch(undefined),
  q: z.string().trim().min(1).max(200).optional().catch(undefined),
  page: z.coerce.number().int().min(1).catch(1),
});

export type VoiceFilters = z.infer<typeof filtersSchema>;

/** Flattens a ZodError into one message per field, for rendering next to inputs. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!(key in result)) result[key] = issue.message;
  }
  return result;
}
