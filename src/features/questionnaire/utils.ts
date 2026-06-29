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
