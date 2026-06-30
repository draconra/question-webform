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

// ─── Domain grouping ─────────────────────────────────────────────────────────

/**
 * Maps each scored variableName to its IMSA domain group.
 * Questions not listed here are non-scored (identity/PRA/Tamb).
 */
export const QUESTION_DOMAIN_MAP: Record<string, string> = {
  // Biologis — Q1a/1b, 2, 3, 4a/4b, 17
  hist_1a_masalah_fisik:           'Biologis',
  hist_1b_penyakit_kronis:         'Biologis',
  hist_2_dilema_diagnostik:        'Biologis',
  saat_ini_3_keparahan_gejala:     'Biologis',
  saat_ini_4a_pemahaman_dokter:    'Biologis',
  saat_ini_4b_pengobatan_tepat:    'Biologis',
  prog_17_perkiraan_fisik:         'Biologis',
  // Psikologis — Q5, 6, 7, 8, 18
  hist_5_cara_mengatasi:           'Psikologis',
  hist_6_kesehatan_mental:         'Psikologis',
  saat_ini_7_resistensi_pengobatan:'Psikologis',
  saat_ini_8_gejala_mental:        'Psikologis',
  prog_18_perkiraan_mental:        'Psikologis',
  // Sosial — Q9a/9c, 10, 11, 12, 19
  hist_9a_memiliki_pekerjaan:      'Sosial',
  hist_9c_kegiatan_luang:          'Sosial',
  hist_10_hubungan_sosial:         'Sosial',
  saat_ini_11_stabilitas_tempat_tinggal: 'Sosial',
  saat_ini_12_dukungan_sosial:     'Sosial',
  prog_19_perkiraan_sosial:        'Sosial',
  // Sistem Kesehatan — Q13, 14, 15, 16, 20
  hist_13_akses_perawatan:         'Sistem Kesehatan',
  hist_14_pengalaman_pengobatan:   'Sistem Kesehatan',
  saat_ini_15_pengaturan_layanan:  'Sistem Kesehatan',
  saat_ini_16_koordinasi_perawatan:'Sistem Kesehatan',
  prog_20_kebutuhan_perawatan:     'Sistem Kesehatan',
}

export const DOMAIN_ORDER = ['Data Diri & Tambahan', 'Biologis', 'Psikologis', 'Sosial', 'Sistem Kesehatan'] as const
export type DomainName = typeof DOMAIN_ORDER[number]

export const DOMAIN_COLORS: Record<DomainName, { bg: string; fg: string }> = {
  'Data Diri & Tambahan': { bg: '#f1f5f9', fg: '#475569' },
  'Biologis':             { bg: '#dbeafe', fg: '#1d4ed8' },
  'Psikologis':           { bg: '#ede9fe', fg: '#7c3aed' },
  'Sosial':               { bg: '#fef3c7', fg: '#b45309' },
  'Sistem Kesehatan':     { bg: '#d1fae5', fg: '#065f46' },
}

// ─── IMSA scoring engine ──────────────────────────────────────────────────────

/** Total max score for IM-SA (Manual IM-SA 2017). */
export const IMSA_MAX_SCORE = 60

/** Scores ≥ this value indicate complexity (Manual IM-SA 2017). */
export const COMPLEXITY_CUTOFF = 19

/**
 * Severity colours per score level (General Principle figure 1, Manual IM-SA 2017).
 * 0 = green (no action), 1 = yellow (monitoring), 2 = orange (treatment), 3 = red (urgent).
 */
export const SEVERITY_COLORS: Record<number, { bg: string; fg: string; label: string }> = {
  0: { bg: '#dcfce7', fg: '#16a34a', label: 'Tak perlu tindakan' },
  1: { bg: '#fef9c3', fg: '#ca8a04', label: 'Monitoring/prevensi' },
  2: { bg: '#ffedd5', fg: '#ea580c', label: 'Perlu treatment' },
  3: { bg: '#fee2e2', fg: '#dc2626', label: 'Segera/intensif' },
}

/**
 * INTERMED Grid layout: 4 domains × 3 time-segments, each cell contains
 * one or more [domainScoreKey, shortLabel] anchor points.
 * Keys match the domainScores returned by calculateImsaScore.
 */
export const IMSA_GRID = [
  {
    domain: 'Biologis',
    segments: {
      Historis:  [['1_kronik_biologis', 'Kronisitas'], ['2_dilema_diagnostik', 'Dilema diagnostik']] as [string, string][],
      'Saat ini': [['3_keparahan_gejala', 'Keparahan gejala'], ['4_tantangan_diagnostik', 'Tantangan dx/terapi']] as [string, string][],
      Prognosis: [['17_prognosis_fisik', 'Komplikasi fisik']] as [string, string][],
    },
  },
  {
    domain: 'Psikologis',
    segments: {
      Historis:  [['5_cara_mengatasi', 'Coping'], ['6_kesehatan_mental', 'Kesehatan mental']] as [string, string][],
      'Saat ini': [['7_resistensi_pengobatan', 'Resistensi pengobatan'], ['8_gejala_mental', 'Gejala mental']] as [string, string][],
      Prognosis: [['18_prognosis_mental', 'Kerentanan mental']] as [string, string][],
    },
  },
  {
    domain: 'Sosial',
    segments: {
      Historis:  [['9_pekerjaan_waktu_luang', 'Pekerjaan & waktu luang'], ['10_hubungan_sosial', 'Hubungan sosial']] as [string, string][],
      'Saat ini': [['11_stabilitas_tinggal', 'Stabilitas tinggal'], ['12_dukungan_sosial', 'Dukungan sosial']] as [string, string][],
      Prognosis: [['19_prognosis_sosial', 'Kerentanan sosial']] as [string, string][],
    },
  },
  {
    domain: 'Sistem Kesehatan',
    segments: {
      Historis:  [['13_akses_perawatan', 'Akses perawatan'], ['14_pengalaman_pengobatan', 'Pengalaman pengobatan']] as [string, string][],
      'Saat ini': [['15_pengaturan_layanan', 'Organisasi layanan'], ['16_koordinasi_perawatan', 'Koordinasi perawatan']] as [string, string][],
      Prognosis: [['20_hambatan_sistem', 'Hambatan sistem']] as [string, string][],
    },
  },
]

/**
 * IMSA Scoring Engine — pure function, no I/O, client-safe.
 *
 * Scoring domains (per the IMSA instrument document):
 *  - Simple domains: the answer value IS the domain score (0–3)
 *  - Composite domain 1  (1a + 1b): max of the two
 *  - Composite domain 4  (4a + 4b): max of the two
 *  - Composite domain 9  (9a + 9b + 9c): determined by employment + leisure activity status
 *  - Domain 15: multi-select checkbox codes → scoreOrganisasiLayanan
 *
 * Variable-name to domain mapping (from the seed):
 *  hist_1a_masalah_fisik + hist_1b_penyakit_kronis  → domain 1  (Kronik biologis)
 *  hist_2_dilema_diagnostik                          → domain 2
 *  saat_ini_3_keparahan_gejala                       → domain 3
 *  saat_ini_4a_pemahaman_dokter + saat_ini_4b_…      → domain 4  (Dx/terapi)
 *  hist_5_cara_mengatasi                             → domain 5
 *  hist_6_kesehatan_mental                           → domain 6
 *  saat_ini_7_resistensi_pengobatan                  → domain 7
 *  saat_ini_8_gejala_mental                          → domain 8
 *  hist_9a_memiliki_pekerjaan + hist_9c_kegiatan…    → domain 9  (Pekerjaan/waktu luang)
 *  hist_10_hubungan_sosial                           → domain 10
 *  saat_ini_11_stabilitas_tempat_tinggal             → domain 11
 *  saat_ini_12_dukungan_sosial                       → domain 12
 *  hist_13_akses_perawatan                           → domain 13
 *  hist_14_pengalaman_pengobatan                     → domain 14
 *  saat_ini_16_koordinasi_perawatan                  → domain 16
 *  prog_17_perkiraan_fisik                           → domain 17
 *  prog_18_perkiraan_mental                          → domain 18
 *  prog_19_perkiraan_sosial                          → domain 19
 *  prog_20_kebutuhan_perawatan                       → domain 20
 */
export function calculateImsaScore(
  answersByVarName: Record<string, number>,
  /** Raw string values for multi-select questions (e.g. Q15 letter codes "a,c,e") */
  rawAnswersByVarName: Record<string, string> = {}
): { totalScore: number; domainScores: Record<string, number> } {
  const v = answersByVarName
  const domains: Record<string, number> = {}

  // Domain 1: Kronik biologis — take maximum of 1a and 1b scores
  const d1a = v['hist_1a_masalah_fisik'] ?? 0
  const d1b = v['hist_1b_penyakit_kronis'] ?? 0
  domains['1_kronik_biologis'] = Math.max(d1a, d1b)

  // Domain 2: Dilema diagnostik — direct
  domains['2_dilema_diagnostik'] = v['hist_2_dilema_diagnostik'] ?? 0

  // Domain 3: Keparahan gejala — direct
  domains['3_keparahan_gejala'] = v['saat_ini_3_keparahan_gejala'] ?? 0

  // Domain 4: Tantangan dx/terapi — take maximum of 4a and 4b
  const d4a = v['saat_ini_4a_pemahaman_dokter'] ?? 0
  const d4b = v['saat_ini_4b_pengobatan_tepat'] ?? 0
  domains['4_tantangan_diagnostik'] = Math.max(d4a, d4b)

  // Domain 5: Cara mengatasi — direct
  domains['5_cara_mengatasi'] = v['hist_5_cara_mengatasi'] ?? 0

  // Domain 6: Kesehatan mental historis — direct
  domains['6_kesehatan_mental'] = v['hist_6_kesehatan_mental'] ?? 0

  // Domain 7: Resistensi pengobatan — direct
  domains['7_resistensi_pengobatan'] = v['saat_ini_7_resistensi_pengobatan'] ?? 0

  // Domain 8: Gejala mental saat ini — direct
  domains['8_gejala_mental'] = v['saat_ini_8_gejala_mental'] ?? 0

  // Domain 9: Pekerjaan dan waktu luang — composite (9a + 9b + 9c)
  // 9a: 1=bekerja, 0=tidak bekerja
  // 9b: 0=kelompok fungsi (pelajar/pensiun/RT), 1=non-fungsi (disabilitas/cuti sakit)
  // 9c: 1=ada kegiatan waktu luang, 0=tidak
  // Functioning group = employed (9a=1) OR not-employed but reason is functioning (9a=0 && 9b=0)
  const d9a = v['hist_9a_memiliki_pekerjaan'] ?? 0
  const d9b = v['hist_9b_alasan_tidak_bekerja'] ?? 0
  const d9c = v['hist_9c_kegiatan_luang'] ?? 0
  const functioning9 = d9a === 1 || (d9a === 0 && d9b === 0)
  if (functioning9 && d9c === 1) domains['9_pekerjaan_waktu_luang'] = 0
  else if (functioning9 && d9c === 0) domains['9_pekerjaan_waktu_luang'] = 1
  else if (!functioning9 && d9c === 1) domains['9_pekerjaan_waktu_luang'] = 2
  else domains['9_pekerjaan_waktu_luang'] = 3

  // Domain 10: Hubungan sosial — direct
  domains['10_hubungan_sosial'] = v['hist_10_hubungan_sosial'] ?? 0

  // Domain 11: Stabilitas tempat tinggal — direct
  domains['11_stabilitas_tinggal'] = v['saat_ini_11_stabilitas_tempat_tinggal'] ?? 0

  // Domain 12: Dukungan sosial — direct
  domains['12_dukungan_sosial'] = v['saat_ini_12_dukungan_sosial'] ?? 0

  // Domain 13: Akses perawatan — direct
  domains['13_akses_perawatan'] = v['hist_13_akses_perawatan'] ?? 0

  // Domain 14: Pengalaman pengobatan — direct
  domains['14_pengalaman_pengobatan'] = v['hist_14_pengalaman_pengobatan'] ?? 0

  // Domain 15: Pengaturan/organisasi layanan — multi-select by letter codes
  // Codes come from rawAnswersByVarName as comma-joined string (e.g. "a,c,e")
  // Score rule: h|i=3 | (c|d)&e=2 | c|d|e=1 | a|b|f|g/j/k (or none)=0
  {
    const raw15 = rawAnswersByVarName[Q15_VARNAME] ?? ''
    domains['15_pengaturan_layanan'] = scoreOrganisasiLayanan(raw15.split(','))
  }

  // Domain 16: Koordinasi perawatan — direct
  domains['16_koordinasi_perawatan'] = v['saat_ini_16_koordinasi_perawatan'] ?? 0

  // Domain 17: Prognosis fisik — direct
  domains['17_prognosis_fisik'] = v['prog_17_perkiraan_fisik'] ?? 0

  // Domain 18: Prognosis mental — direct
  domains['18_prognosis_mental'] = v['prog_18_perkiraan_mental'] ?? 0

  // Domain 19: Prognosis sosial — direct
  domains['19_prognosis_sosial'] = v['prog_19_perkiraan_sosial'] ?? 0

  // Domain 20: Hambatan sistem kesehatan — direct
  domains['20_hambatan_sistem'] = v['prog_20_kebutuhan_perawatan'] ?? 0

  const totalScore = Object.values(domains).reduce((sum, s) => sum + s, 0)
  return { totalScore, domainScores: domains }
}

/**
 * Build the two input maps required by calculateImsaScore from the
 * answerDistribution data returned by getAnalytics (single-inisial view).
 *
 * For radio/number questions: the single key in answerDistribution IS the
 * stored value.  For checkbox (Q15): keys are individual option codes already
 * split by repository.getAnalytics; we re-join them so scoreOrganisasiLayanan
 * receives the comma-joined string it expects.
 */
export function buildScoreInputs(
  questions: { variableName: string; type: string; answerDistribution: Record<string, number> }[]
): { answersByVarName: Record<string, number>; rawAnswersByVarName: Record<string, string> } {
  const answersByVarName: Record<string, number> = {}
  const rawAnswersByVarName: Record<string, string> = {}
  for (const q of questions) {
    const keys = Object.keys(q.answerDistribution)
    if (keys.length === 0) continue
    // Rejoin checkbox codes; for radio/number take the first key
    rawAnswersByVarName[q.variableName] = keys.join(',')
    // Numeric score from first key (radio options store numeric values)
    const num = parseInt(keys[0], 10)
    if (!isNaN(num)) answersByVarName[q.variableName] = num
  }
  return { answersByVarName, rawAnswersByVarName }
}
