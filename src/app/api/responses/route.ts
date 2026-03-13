import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { QuestionnaireService, PrismaQuestionnaireRepository } from '@/features/questionnaire'
import { randomUUID } from 'crypto'

export async function POST(req: Request) {
  const correlationId = randomUUID()
  const operation = 'submit_response'
  const startTime = Date.now()

  logger.info('Operation started', { operation, correlationId })

  try {
    const body = await req.json()

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
        inisial: body.inisial ?? '',
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

    const isValidationError = message.includes('Invalid') || message.includes('wajib')
    return NextResponse.json(
      { error: message },
      { status: isValidationError ? 400 : 500 }
    )
  }
}
