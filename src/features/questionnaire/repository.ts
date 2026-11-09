import { PrismaClient, FormTemplate, Question, Response, Answer } from '@prisma/client'
import { FormTemplateWithQuestions } from './types'
import { parseOptions } from './utils'
export type { FormTemplateWithQuestions }

export type ResponseWithAnswers = Response & {
  answers: Answer[]
}

export type AnalyticsQuestion = {
  id: string
  variableName: string
  prompt: string
  type: string
  options: Array<{ label: string; value: string | number }> | null
  answerDistribution: Record<string, number> // value -> count (checkbox: split tokens)
}

export type ScoreSummary = {
  id: string
  inisial: string
  totalScore: number
  date: Date
  nama?: string | null
  noTelp?: string | null
  /** Whether a signature was captured — the raw image is no longer shipped to the dashboard table. */
  hasSignature: boolean
}

/** Full PII payload needed to render a signed consent PDF for one response. */
export type ConsentResponse = {
  id: string
  inisial: string | null
  nama: string | null
  alamat: string | null
  noTelp: string | null
  signature: string | null
  createdAt: Date
}

/** Minimal shape needed by buildStataCSV — deliberately excludes signature/nama/alamat/noTelp. */
export type TemplateExportData = {
  questions: Question[]
  responses: Array<{
    id: string
    inisial: string | null
    totalScore: number | null
    createdAt: Date
    answers: Array<{ questionId: string; value: string | null }>
  }>
}

export type TemplateSummary = { title: string; questionCount: number }

export interface QuestionnaireRepository {
  getTemplate(): Promise<FormTemplateWithQuestions | null>
  /** Just enough to render the admin dashboard header — no question rows. */
  getTemplateSummary(): Promise<TemplateSummary | null>
  /** questionId → variableName, for scoring a submission. No prompt/options/orderIndex. */
  getQuestionVarNames(): Promise<Record<string, string>>
  getTemplateWithResponses(): Promise<TemplateExportData | null>
  saveResponse(formTemplateId: string, inisial: string, totalScore: number, answers: { questionId: string; value: string }[], extra?: { nama?: string; noTelp?: string; signature?: string; alamat?: string }): Promise<Response>
  countResponses(): Promise<number>
  getAnalytics(responseId?: string): Promise<AnalyticsQuestion[]>
  getScoresByInisial(): Promise<ScoreSummary[]>
  getConsentResponse(id: string): Promise<ConsentResponse | null>
  /** Marks a response as deleted without removing it from the database. Returns false if the id doesn't exist or is already deleted. */
  softDeleteResponse(id: string): Promise<boolean>
}

/**
 * Production Prisma implementation of QuestionnaireRepository.
 */
export class PrismaQuestionnaireRepository implements QuestionnaireRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getTemplate(): Promise<FormTemplateWithQuestions | null> {
    return this.prisma.formTemplate.findFirst({
      include: {
        questions: { orderBy: { orderIndex: 'asc' } },
      },
    })
  }

  async getTemplateSummary(): Promise<TemplateSummary | null> {
    const template = await this.prisma.formTemplate.findFirst({
      select: { title: true, _count: { select: { questions: true } } },
    })
    if (!template) return null
    return { title: template.title, questionCount: template._count.questions }
  }

  async getQuestionVarNames(): Promise<Record<string, string>> {
    const template = await this.prisma.formTemplate.findFirst({
      select: { questions: { select: { id: true, variableName: true } } },
    })
    if (!template) return {}
    return Object.fromEntries(template.questions.map((q) => [q.id, q.variableName]))
  }

  async getTemplateWithResponses(): Promise<TemplateExportData | null> {
    return this.prisma.formTemplate.findFirst({
      select: {
        questions: { orderBy: { orderIndex: 'asc' } },
        responses: {
          where: { deletedAt: null },
          select: {
            id: true,
            inisial: true,
            totalScore: true,
            createdAt: true,
            answers: { select: { questionId: true, value: true } },
          },
        },
      },
    })
  }

  async saveResponse(
    formTemplateId: string,
    inisial: string,
    totalScore: number,
    answers: { questionId: string; value: string }[],
    extra?: { nama?: string; noTelp?: string; signature?: string; alamat?: string }
  ): Promise<Response> {
    return this.prisma.response.create({
      data: {
        formTemplateId,
        inisial,
        totalScore,
        nama: extra?.nama,
        alamat: extra?.alamat,
        noTelp: extra?.noTelp,
        signature: extra?.signature,
        answers: {
          create: answers.map((ans) => ({
            questionId: ans.questionId,
            value: ans.value,
          })),
        },
      },
    })
  }

  async countResponses(): Promise<number> {
    return this.prisma.response.count({ where: { deletedAt: null } })
  }

  async getAnalytics(responseId?: string): Promise<AnalyticsQuestion[]> {
    const template = await this.prisma.formTemplate.findFirst({
      include: {
        questions: { orderBy: { orderIndex: 'asc' } },
        responses: {
          // Filtered by the exact Response row, not by `inisial` text — `inisial` has
          // no unique constraint (prisma/schema.prisma), so two different submissions
          // can share one, and filtering by text alone would merge their answers into
          // one "patient" view (e.g. both jenis_kelamin values showing at once).
          where: { deletedAt: null, ...(responseId ? { id: responseId } : {}) },
          // Only the answer pairs are used below — signature/nama/alamat/noTelp
          // would otherwise ride along on every response row for nothing.
          select: { answers: { select: { questionId: true, value: true } } },
        },
      },
    })
    if (!template) return []

    // One questionId → value map per response, built once, instead of an
    // Array.find() per (question, response) pair — O(responses × answers)
    // instead of O(questions × responses × answers).
    const answerMaps = template.responses.map((r) => new Map(r.answers.map((a) => [a.questionId, a.value])))

    return template.questions.map((question) => {
      const distribution: Record<string, number> = {}
      for (const answerMap of answerMaps) {
        const value = answerMap.get(question.id)
        if (value != null) {
          // Checkbox answers are stored as comma-joined tokens (e.g. "a,c,e" or "Hipertensi, Stroke").
          // Split each token so the distribution counts individual selections, not whole combo strings.
          const tokens = question.type === 'checkbox'
            ? value.split(',').map(s => s.trim()).filter(Boolean)
            : [value]
          for (const t of tokens) distribution[t] = (distribution[t] ?? 0) + 1
        }
      }
      return {
        id: question.id,
        variableName: question.variableName,
        prompt: question.prompt,
        type: question.type,
        options: parseOptions(question.options),
        answerDistribution: distribution,
      }
    })
  }

  async getScoresByInisial(): Promise<ScoreSummary[]> {
    const responses = await this.prisma.response.findMany({
      where: {
        deletedAt: null,
        totalScore: { not: null },
        inisial: { not: null, notIn: [""] }
      },
      orderBy: { createdAt: 'desc' },
      // Excludes `signature` (base64 PNG, up to ~300KB each) — this list can be
      // dozens of rows and the table only needs a has-one-or-not flag for it.
      select: { id: true, inisial: true, totalScore: true, createdAt: true, nama: true, noTelp: true },
    })
    if (responses.length === 0) return []

    // Second, narrow query just to know *which* of those rows has a signature.
    // A `signature IS NOT NULL` check doesn't require reading the TOASTed value,
    // so this is cheap — nowhere near the cost of selecting `signature` above.
    const withSignature = await this.prisma.response.findMany({
      where: { id: { in: responses.map((r) => r.id) }, signature: { not: null } },
      select: { id: true },
    })
    const signatureIds = new Set(withSignature.map((r) => r.id))

    return responses.map(r => ({
      id: r.id,
      inisial: r.inisial as string,
      totalScore: r.totalScore as number,
      date: r.createdAt,
      nama: r.nama,
      noTelp: r.noTelp,
      hasSignature: signatureIds.has(r.id),
    }))
  }

  async getConsentResponse(id: string): Promise<ConsentResponse | null> {
    const r = await this.prisma.response.findFirst({ where: { id, deletedAt: null } })
    if (!r) return null
    return {
      id: r.id,
      inisial: r.inisial,
      nama: r.nama,
      alamat: r.alamat,
      noTelp: r.noTelp,
      signature: r.signature,
      createdAt: r.createdAt,
    }
  }

  async softDeleteResponse(id: string): Promise<boolean> {
    const { count } = await this.prisma.response.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    })
    return count > 0
  }
}
