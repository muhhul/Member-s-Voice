/**
 * Escapes the LIKE/ILIKE metacharacters so a search for "100%" matches the
 * literal text instead of becoming a wildcard that matches everything.
 */
export function escapeLike(term: string): string {
  return term.replace(/[\\%_]/g, (character) => "\\" + character);
}
