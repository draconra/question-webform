import { FormTemplate, Question, Answer, Response } from '@prisma/client'
import { QuestionnaireRepository, AnalyticsQuestion, ScoreSummary, ConsentResponse } from './repository'
import { FormTemplateWithQuestions, ParsedFormTemplate, ParsedQuestion, QuestionOption } from './types'
import { calculateImsaScore } from './utils'

// Re-export so existing imports of calculateImsaScore from service.ts keep working.
export { calculateImsaScore }

export type SubmitAnswersInput = {
  formTemplateId: string
  inisial: string
  nama?: string
  alamat?: string
  noTelp?: string
  signature?: string
  answers: Array<{ questionId: string; value: string }>
}

export type ValidationResult =
  | { success: true }
  | { success: false; error: string }

/**
 * Pure business logic for the questionnaire feature.
 * All I/O is performed via the injected repository.
 */
export class QuestionnaireService {
  constructor(private readonly repository: QuestionnaireRepository) {}

  async getTemplate(): Promise<ParsedFormTemplate | null> {
    const template = await this.repository.getTemplate()
    if (!template) return null

    const parsedQuestions: ParsedQuestion[] = template.questions.map((q) => ({
      ...q,
      options: q.options ? JSON.parse(q.options) : null
    }))

    return {
      ...template,
      questions: parsedQuestions
    }
  }

  async getTemplateWithResponses(): Promise<(FormTemplate & { questions: Question[]; responses: (Response & { answers: Answer[] })[] }) | null> {
    return this.repository.getTemplateWithResponses()
  }

  async getScoresByInisial(): Promise<ScoreSummary[]> {
    return this.repository.getScoresByInisial()
  }

  async getConsentResponse(id: string): Promise<ConsentResponse | null> {
    return this.repository.getConsentResponse(id)
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

    // Build variableName→numericValue and →rawString maps for scoring
    const answersByVarName: Record<string, number> = {}
    const rawAnswersByVarName: Record<string, string> = {}
    for (const ans of input.answers) {
      const varName = questionVarNames[ans.questionId]
      if (varName) {
        rawAnswersByVarName[varName] = ans.value
        const num = parseInt(ans.value, 10)
        if (!isNaN(num)) {
          answersByVarName[varName] = num
        }
      }
    }

    const { totalScore } = calculateImsaScore(answersByVarName, rawAnswersByVarName)

    return this.repository.saveResponse(
      input.formTemplateId,
      input.inisial.trim(),
      totalScore,
      input.answers,
      { nama: input.nama, alamat: input.alamat, noTelp: input.noTelp, signature: input.signature }
    )
  }

  /**
   * Internal helper to escape CSV cells.
   * Wraps in double quotes and escapes internal double quotes.
   */
  private escapeCSVCell(value: string | number | null | undefined): string {
    if (value === null || value === undefined) return '""'
    let str = String(value)
    // Neutralize CSV formula injection: prefix dangerous leading chars with single-quote
    // Protects against malicious inisial values like "=cmd()" or "+cmd()" in Excel/Stata
    if (/^[=+\-@\t\r]/.test(str)) {
      str = "'" + str
    }
    // Wrap in quotes and escape internal quotes by doubling them
    return `"${str.replace(/"/g, '""')}"`
  }

  /**
   * Stata variable names are capped at 32 characters (import delimited errors/truncates
   * past that). Truncate to 32 and disambiguate collisions with a numeric suffix so two
   * long names that share a 32-char prefix don't silently collapse into the same column.
   */
  private toStataVarName(name: string, used: Set<string>): string {
    let candidate = name.length > 32 ? name.slice(0, 32) : name
    if (used.has(candidate)) {
      const base = candidate.slice(0, 29)
      let n = 2
      while (used.has(`${base}_${n}`)) n++
      candidate = `${base}_${n}`
    }
    used.add(candidate)
    return candidate
  }

  /**
   * Stata's `import delimited` never auto-parses date/time text — but an unambiguous
   * "YYYY-MM-DD HH:MM:SS" (no "T"/"Z"/milliseconds) is parseable in one step with
   * `clock(created_at, "YMDhms")`, unlike raw ISO 8601 which needs pre-cleanup first.
   */
  private formatStataDatetime(date: Date): string {
    return date.toISOString().replace('T', ' ').replace(/\.\d+Z$/, '')
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
    const usedNames = new Set<string>(['response_id', 'inisial', 'total_score', 'created_at'])
    const headers = [
      'response_id', 'inisial', 'total_score', 'created_at',
      ...template.questions.map((q) => this.toStataVarName(q.variableName, usedNames)),
    ]
    const escapedHeaders = headers.map(h => this.escapeCSVCell(h)).join(',')

    const rows = template.responses.map(response => {
      const row: string[] = [
        this.escapeCSVCell(response.id),
        this.escapeCSVCell(response.inisial),
        this.escapeCSVCell(response.totalScore),
        this.escapeCSVCell(this.formatStataDatetime(response.createdAt))
      ]
      for (const question of template.questions) {
        const answer = response.answers.find((a) => a.questionId === question.id)
        row.push(this.escapeCSVCell(answer?.value))
      }
      return row.join(',')
    })
    return [escapedHeaders, ...rows].join('\n')
  }

  async generateStataExport(): Promise<string> {
    const template = await this.repository.getTemplateWithResponses()
    if (!template) {
      throw new Error('No template found')
    }
    return this.buildStataCSV(template)
  }
}
