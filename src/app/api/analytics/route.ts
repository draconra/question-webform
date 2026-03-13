import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { QuestionnaireService, PrismaQuestionnaireRepository } from '@/features/questionnaire'
import { randomUUID } from 'crypto'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const inisial = searchParams.get('inisial') || undefined

  const correlationId = randomUUID()
  const operation = 'get_analytics'
  const startTime = Date.now()

  logger.info('Operation started', { operation, correlationId })

  try {
    const repository = new PrismaQuestionnaireRepository(prisma)
    const service = new QuestionnaireService(repository)
    const analytics = await service.getAnalytics(inisial)

    const duration = Date.now() - startTime
    logger.info('Operation succeeded', { operation, correlationId, duration })

    return NextResponse.json(analytics)
  } catch (error) {
    const duration = Date.now() - startTime
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Operation failed', { operation, correlationId, duration, error: message })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
