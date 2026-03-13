import { PrismaClient, FormTemplate, Question, Response, Answer } from '@prisma/client'

export type FormTemplateWithQuestions = FormTemplate & {
  questions: Question[]
}

export type ResponseWithAnswers = Response & {
  answers: Answer[]
}

export type AnalyticsQuestion = {
  id: string
  variableName: string
  prompt: string
  type: string
  options: Array<{ label: string; value: number }> | null
  answerDistribution: Record<string, number> // value -> count
}

export type ScoreSummary = {
  inisial: string
  totalScore: number
  date: Date
}

/**
 * Contract for questionnaire data access.
 * Abstracted so it can be mocked in unit tests without hitting a real database.
 */
export interface QuestionnaireRepository {
  getTemplate(): Promise<FormTemplateWithQuestions | null>
  getTemplateWithResponses(): Promise<(FormTemplate & { questions: Question[]; responses: (Response & { answers: Answer[] })[] }) | null>
  saveResponse(formTemplateId: string, inisial: string, totalScore: number, answers: { questionId: string; value: string }[]): Promise<Response>
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
    answers: { questionId: string; value: string }[]
  ): Promise<Response> {
    return this.prisma.response.create({
      data: {
        formTemplateId,
        inisial,
        totalScore,
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
        if (answer?.value !== undefined && answer.value !== null) {
          distribution[answer.value] = (distribution[answer.value] ?? 0) + 1
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
      date: r.createdAt
    }))
  }
}
