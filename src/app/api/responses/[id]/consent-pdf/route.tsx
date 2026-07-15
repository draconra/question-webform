import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { QuestionnaireService, PrismaQuestionnaireRepository } from '@/features/questionnaire'
import { randomUUID } from 'crypto'
import { auth } from '@/auth'
import ConsentDocument from '@/features/questionnaire/pdf/ConsentDocument'

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const correlationId = randomUUID()
  const operation = 'export_consent_pdf'
  const startTime = Date.now()

  logger.info('Operation started', { operation, correlationId })

  try {
    const { id } = await ctx.params
    const repository = new PrismaQuestionnaireRepository(prisma)
    const service = new QuestionnaireService(repository)
    const data = await service.getConsentResponse(id)

    if (!data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const buffer = await renderToBuffer(<ConsentDocument data={data} />)

    const duration = Date.now() - startTime
    logger.info('Operation succeeded', { operation, correlationId, duration, responseId: id })

    const filenameSafeInisial = (data.inisial ?? 'responden').replace(/[^a-zA-Z0-9_-]/g, '')
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="persetujuan_${filenameSafeInisial}_${data.id.slice(0, 8)}.pdf"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    const duration = Date.now() - startTime
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Operation failed', { operation, correlationId, duration, error: message })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
