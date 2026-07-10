import { PrismaClient, FormTemplate, Question, Response, Answer } from '@prisma/client'
import { FormTemplateWithQuestions } from './types'
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
  inisial: string
  totalScore: number
  date: Date
  nama?: string | null
  noTelp?: string | null
  signature?: string | null
}

export interface QuestionnaireRepository {
  getTemplate(): Promise<FormTemplateWithQuestions | null>
  getTemplateWithResponses(): Promise<(FormTemplate & { questions: Question[]; responses: (Response & { answers: Answer[] })[] }) | null>
  saveResponse(formTemplateId: string, inisial: string, totalScore: number, answers: { questionId: string; value: string }[], extra?: { nama?: string; noTelp?: string; signature?: string; alamat?: string }): Promise<Response>
  countResponses(): Promise<number>
  getAnalytics(inisial?: string): Promise<AnalyticsQuestion[]>
  getScoresByInisial(): Promise<ScoreSummary[]>
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

  async getTemplateWithResponses() {
    return this.prisma.formTemplate.findFirst({
      include: {
        questions: { orderBy: { orderIndex: 'asc' } },
        responses: { include: { answers: true } },
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
    return this.prisma.response.count()
  }

  async getAnalytics(inisial?: string): Promise<AnalyticsQuestion[]> {
    const template = await this.prisma.formTemplate.findFirst({
      include: {
        questions: { orderBy: { orderIndex: 'asc' } },
        responses: { 
          where: inisial ? { inisial } : undefined,
          include: { answers: true } 
        },
      },
    })
    if (!template) return []

    return template.questions.map((question) => {
      const distribution: Record<string, number> = {}
      for (const response of template.responses) {
        const answer = response.answers.find((a) => a.questionId === question.id)
        if (answer?.value != null) {
          // Checkbox answers are stored as comma-joined tokens (e.g. "a,c,e" or "Hipertensi, Stroke").
          // Split each token so the distribution counts individual selections, not whole combo strings.
          const tokens = question.type === 'checkbox'
            ? answer.value.split(',').map(s => s.trim()).filter(Boolean)
            : [answer.value]
          for (const t of tokens) distribution[t] = (distribution[t] ?? 0) + 1
        }
      }
      return {
        id: question.id,
        variableName: question.variableName,
        prompt: question.prompt,
        type: question.type,
        options: question.options ? JSON.parse(question.options) : null,
        answerDistribution: distribution,
      }
    })
  }

  async getScoresByInisial(): Promise<ScoreSummary[]> {
    const responses = await this.prisma.response.findMany({
      where: {
        totalScore: { not: null },
        inisial: { not: null, notIn: [""] }
      },
      orderBy: { createdAt: 'desc' }
    })

    return responses.map(r => ({
      inisial: r.inisial as string,
      totalScore: r.totalScore as number,
      date: r.createdAt,
      nama: r.nama,
      noTelp: r.noTelp,
      signature: r.signature,
    }))
  }
}
