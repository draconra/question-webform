import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { QuestionnaireService, PrismaQuestionnaireRepository } from '@/features/questionnaire'
import { randomUUID } from 'crypto'

export async function GET() {
  const correlationId = randomUUID()
  const operation = 'export_stata_csv'
  const startTime = Date.now()

  logger.info('Operation started', { operation, correlationId })

  try {
    const repository = new PrismaQuestionnaireRepository(prisma)
    const service = new QuestionnaireService(repository)

    const csvContent = await service.generateStataExport()

    const duration = Date.now() - startTime
    logger.info('Operation succeeded', { operation, correlationId, duration })

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="stata_export_${new Date().toISOString()}.csv"`,
      },
    })
  } catch (error) {
    const duration = Date.now() - startTime
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Operation failed', { operation, correlationId, duration, error: message })
    return new NextResponse('Internal server error', { status: 500 })
  }
}
