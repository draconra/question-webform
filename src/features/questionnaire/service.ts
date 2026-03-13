import { FormTemplate, Question, Answer, Response } from '@prisma/client'
import { QuestionnaireRepository, FormTemplateWithQuestions, AnalyticsQuestion, ScoreSummary } from './repository'

export type SubmitAnswersInput = {
  formTemplateId: string
  inisial: string
  answers: Array<{ questionId: string; value: string }>
}

export type ValidationResult =
  | { success: true }
  | { success: false; error: string }

/**
 * IMSA Scoring Engine — pure function, no I/O.
 *
 * Scoring domains (per the IMSA instrument document):
 *  - Simple domains: the answer value IS the domain score (0–3)
 *  - Composite domain 1  (1a + 1b): max of the two
 *  - Composite domain 4  (4a + 4b): max of the two
 *  - Composite domain 9  (9a + 9c): determined by employment + leisure activity status
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
  answersByVarName: Record<string, number>
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

  // Domain 9: Pekerjaan dan waktu luang — composite
  // 9a: 1=bekerja, 0=tidak bekerja  |  9c: 1=ada kegiatan, 0=tidak
  const d9a = v['hist_9a_memiliki_pekerjaan'] ?? 0  // 1=yes, 0=no
  const d9c = v['hist_9c_kegiatan_luang'] ?? 0       // 1=yes, 0=no
  if (d9a === 1 && d9c === 1) domains['9_pekerjaan_waktu_luang'] = 0
  else if (d9a === 1 && d9c === 0) domains['9_pekerjaan_waktu_luang'] = 1
  else if (d9a === 0 && d9c === 1) domains['9_pekerjaan_waktu_luang'] = 2
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
 * Pure business logic for the questionnaire feature.
 * All I/O is performed via the injected repository.
 */
export class QuestionnaireService {
  constructor(private readonly repository: QuestionnaireRepository) {}

  async getTemplate(): Promise<FormTemplateWithQuestions | null> {
    return this.repository.getTemplate()
  }

  async getTemplateWithResponses(): Promise<(FormTemplate & { questions: Question[]; responses: (Response & { answers: Answer[] })[] }) | null> {
    return this.repository.getTemplateWithResponses()
  }

  async getScoresByInisial(): Promise<ScoreSummary[]> {
    return this.repository.getScoresByInisial()
  }

  async countResponses(): Promise<number> {
    return this.repository.countResponses()
  }

  async getAnalytics(inisial?: string): Promise<AnalyticsQuestion[]> {
    return this.repository.getAnalytics(inisial)
  }

  /**
   * Pure validation — no I/O. Returns a result object.
   */
  validateSubmission(input: SubmitAnswersInput): ValidationResult {
    if (!input.formTemplateId || typeof input.formTemplateId !== 'string') {
      return { success: false, error: 'Invalid formTemplateId' }
    }
    if (!input.inisial || typeof input.inisial !== 'string' || input.inisial.trim() === '') {
      return { success: false, error: 'Inisial wajib diisi' }
    }
    if (!Array.isArray(input.answers) || input.answers.length === 0) {
      return { success: false, error: 'Answers must be a non-empty array' }
    }
    for (const ans of input.answers) {
      if (!ans.questionId || ans.value === undefined || ans.value === null) {
        return { success: false, error: `Invalid answer entry: ${JSON.stringify(ans)}` }
      }
    }
    return { success: true }
  }

  async submitResponse(
    input: SubmitAnswersInput,
    questionVarNames: Record<string, string> // questionId → variableName
  ) {
    const validation = this.validateSubmission(input)
    if (!validation.success) {
      throw new Error(validation.error)
    }

    // Build variableName→numericValue map for scoring
    const answersByVarName: Record<string, number> = {}
    for (const ans of input.answers) {
      const varName = questionVarNames[ans.questionId]
      if (varName) {
        const num = parseInt(ans.value, 10)
        if (!isNaN(num)) {
          answersByVarName[varName] = num
        }
      }
    }

    const { totalScore } = calculateImsaScore(answersByVarName)

    return this.repository.saveResponse(
      input.formTemplateId,
      input.inisial.trim(),
      totalScore,
      input.answers
    )
  }

  /**
   * Pure transformation — generates CSV content from raw data.
   * No I/O involved; easily testable.
   */
  buildStataCSV(template: {
    questions: Array<{ id: string; variableName: string }>
    responses: Array<{
      id: string
      inisial: string | null
      totalScore: number | null
      createdAt: Date
      answers: Array<{ questionId: string; value: string | null }>
    }>
  }): string {
    const headers = ['response_id', 'inisial', 'total_score', 'created_at', ...template.questions.map((q) => q.variableName)]
    const rows = template.responses.map(response => {
      // Basic info
      const row: (string | number)[] = [
        response.id,
        response.inisial || '',
        response.totalScore === null ? '' : response.totalScore,
        response.createdAt.toISOString()
      ]
      for (const question of template.questions) {
        const answer = response.answers.find((a) => a.questionId === question.id)
        row.push(answer?.value ?? '')
      }
      return row.join(',')
    })
    return [headers.join(','), ...rows].join('\n')
  }

  async generateStataExport(): Promise<string> {
    const template = await this.repository.getTemplateWithResponses()
    if (!template) {
      throw new Error('No template found')
    }
    return this.buildStataCSV(template)
  }
}
