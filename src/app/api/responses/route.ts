import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { QuestionnaireService, PrismaQuestionnaireRepository } from '@/features/questionnaire'
import { randomUUID } from 'crypto'

const MAX_INISIAL_LEN = 10
const MAX_ANSWER_VALUE_LEN = 500

function validateBody(body: unknown): { formTemplateId: string; inisial: string; answers: { questionId: string; value: string }[] } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw Object.assign(new Error('Payload tidak valid'), { validation: true })
  }
  const b = body as Record<string, unknown>

  if (typeof b.formTemplateId !== 'string' || !b.formTemplateId.trim()) {
    throw Object.assign(new Error('formTemplateId wajib diisi'), { validation: true })
  }
  if (typeof b.inisial !== 'string' || !b.inisial.trim()) {
    throw Object.assign(new Error('Inisial wajib diisi'), { validation: true })
  }
  if (b.inisial.length > MAX_INISIAL_LEN) {
    throw Object.assign(new Error(`Inisial maksimal ${MAX_INISIAL_LEN} karakter`), { validation: true })
  }
  if (!Array.isArray(b.answers)) {
    throw Object.assign(new Error('Answers wajib berupa array'), { validation: true })
  }
  for (const a of b.answers as unknown[]) {
    if (!a || typeof a !== 'object' || Array.isArray(a)) {
      throw Object.assign(new Error('Format answer tidak valid'), { validation: true })
    }
    const ans = a as Record<string, unknown>
    if (typeof ans.questionId !== 'string' || !ans.questionId.trim()) {
      throw Object.assign(new Error('questionId wajib diisi pada setiap answer'), { validation: true })
    }
    if (typeof ans.value !== 'string') {
      throw Object.assign(new Error('value wajib berupa string'), { validation: true })
    }
    if (ans.value.length > MAX_ANSWER_VALUE_LEN) {
      throw Object.assign(new Error(`Nilai jawaban terlalu panjang (maks ${MAX_ANSWER_VALUE_LEN} karakter)`), { validation: true })
    }
  }
  return {
    formTemplateId: (b.formTemplateId as string).trim(),
    inisial: (b.inisial as string).trim(),
    answers: b.answers as { questionId: string; value: string }[],
  }
}

export async function POST(req: Request) {
  const correlationId = randomUUID()
  const operation = 'submit_response'
  const startTime = Date.now()

  logger.info('Operation started', { operation, correlationId })

  try {
    const rawBody = await req.json()
    const body = validateBody(rawBody)

    const repository = new PrismaQuestionnaireRepository(prisma)
    const service = new QuestionnaireService(repository)

    // Fetch variable names for scoring (questionId → variableName)
    const template = await service.getTemplate()
    const questionVarNames: Record<string, string> = {}
    if (template) {
      for (const q of template.questions) {
        questionVarNames[q.id] = q.variableName
      }
    }

    const response = await service.submitResponse(
      {
        formTemplateId: body.formTemplateId,
        inisial: body.inisial,
        answers: body.answers,
      },
      questionVarNames
    )

    const duration = Date.now() - startTime
    logger.info('Operation succeeded', { operation, correlationId, duration, responseId: response.id })

    return NextResponse.json({ success: true, response })
  } catch (error) {
    const duration = Date.now() - startTime
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Operation failed', { operation, correlationId, duration, error: message })

    const isValidationError = (error as { validation?: boolean }).validation === true
    return NextResponse.json(
      { error: isValidationError ? message : 'Terjadi kesalahan pada server. Silakan coba lagi.' },
      { status: isValidationError ? 400 : 500 }
    )
  }
}
