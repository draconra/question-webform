import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { QuestionnaireService, PrismaQuestionnaireRepository } from '@/features/questionnaire'
import { randomUUID } from 'crypto'
import { auth } from '@/auth'

export async function GET() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const correlationId = randomUUID()
  const operation = 'get_scores'
  const startTime = Date.now()

  logger.info('Operation started', { operation, correlationId })

  try {
    const repository = new PrismaQuestionnaireRepository(prisma)
    const service = new QuestionnaireService(repository)
    const scores = await service.getScoresByInisial()

    const duration = Date.now() - startTime
    logger.info('Operation succeeded', { operation, correlationId, duration })

    return NextResponse.json(scores)
  } catch (error) {
    const duration = Date.now() - startTime
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Operation failed', { operation, correlationId, duration, error: message })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
