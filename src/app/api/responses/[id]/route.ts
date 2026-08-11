import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { QuestionnaireService, PrismaQuestionnaireRepository } from '@/features/questionnaire'
import { randomUUID } from 'crypto'
import { auth } from '@/auth'

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const correlationId = randomUUID()
  const operation = 'soft_delete_response'
  const startTime = Date.now()

  logger.info('Operation started', { operation, correlationId })

  try {
    const { id } = await ctx.params
    const repository = new PrismaQuestionnaireRepository(prisma)
    const service = new QuestionnaireService(repository)
    const deleted = await service.softDeleteResponse(id)

    if (!deleted) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const duration = Date.now() - startTime
    logger.info('Operation succeeded', { operation, correlationId, duration, responseId: id })

    return NextResponse.json({ success: true })
  } catch (error) {
    const duration = Date.now() - startTime
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Operation failed', { operation, correlationId, duration, error: message })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
