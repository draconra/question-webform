/**
 * Mask a phone number for privacy-preserving storage.
 * Keeps the first 4 digits and last 2 digits; replaces the middle with '*'.
 *
 * Examples:
 *   "081234567890" → "0812******90"
 *   "62811"        → "62811"  (≤6 digits: returned as-is)
 *
 * Non-digit characters are stripped before masking so inputs like
 * "+62 812-3456-7890" are handled correctly.
 */
export function maskPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.length <= 6) return digits
  return digits.slice(0, 4) + '*'.repeat(digits.length - 6) + digits.slice(-2)
}

/**
 * Configuration for questions that have inline conditional sub-questions.
 * The sub is rendered (and required) only when the parent option index is in `showWhenIdx`.
 *
 * Shared between Wizard (render logic) and AnalyticsDashboard (fold sub into parent row).
 */
export type NestedSubConfig = { subVar: string; showWhenIdx: number[] }

export const NESTED_SUBS: Record<string, NestedSubConfig> = {
  // PRA-2: sub (who helped fill) shown only for option b (idx 1) or c (idx 2)
  pra_2_pengisi_kuesioner: { subVar: 'pra_2_pendamping', showWhenIdx: [1, 2] },
  // 9a: sub (reason not working) shown only for "Tidak" (idx 1)
  hist_9a_memiliki_pekerjaan: { subVar: 'hist_9b_alasan_tidak_bekerja', showWhenIdx: [1] },
}

/** All variableNames that are rendered inline and must be excluded from stepped questions. */
export const NESTED_SUB_VARS: string[] = Object.values(NESTED_SUBS).map(s => s.subVar)

/** variableName for Q15 (multi-select organisasi layanan, checkbox). */
export const Q15_VARNAME = 'saat_ini_15_pengaturan_layanan'

/**
 * Compute IMSA domain-15 score (organisasi layanan saat ini) from selected
 * option codes (letters a–k).
 *
 * Rules:
 *   h | i                         → 3
 *   (c | d) & e                   → 2
 *   c | d | e                     → 1
 *   a / b / f / g / j / k / none  → 0
 */
export function scoreOrganisasiLayanan(codes: Iterable<string>): number {
  const set = new Set([...codes].map(c => c.trim()).filter(Boolean))
  if (set.has('h') || set.has('i')) return 3
  if ((set.has('c') || set.has('d')) && set.has('e')) return 2
  if (set.has('c') || set.has('d') || set.has('e')) return 1
  return 0
}
