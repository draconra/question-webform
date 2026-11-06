import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { requireAdmin } from '@/lib/requireAdmin'

export async function POST() {
  const authResult = await requireAdmin()
  if (!authResult.ok) return authResult.response

  try {
    const existingTemplate = await prisma.formTemplate.findFirst({
      where: { title: 'IMSA Questionnaire' }
    })

    if (existingTemplate) {
      return NextResponse.json({ message: 'IMSA Questionnaire template already exists. Skipping seed.' })
    }

    const imsaTemplate = await prisma.formTemplate.create({
      data: {
        title: 'IMSA Questionnaire',
        description: 'International Multimorbidity and Severity Assessment (IMSA) — Kuesioner untuk menilai tingkat keparahan kondisi kesehatan Anda secara menyeluruh.',
      },
    })

    const { IMSA_QUESTIONS } = await import('@/features/questionnaire/data')

    for (const q of IMSA_QUESTIONS) {
      await prisma.question.create({
        data: {
          variableName: q.variableName,
          type: q.type,
          prompt: q.prompt,
          options: q.options ? JSON.stringify(q.options) : null,
          orderIndex: q.orderIndex,
          required: q.required,
          formTemplateId: imsaTemplate.id,
        },
      })
    }

    // NOTE: /questionnaire and /api/responses both cache the template/question list
    // for up to 1 hour (unstable_cache). This Next version's revalidateTag() requires
    // a cache-life profile that unstable_cache's plain string tags don't satisfy, so
    // there's no proactive invalidation here — after a (re)seed, it can take up to an
    // hour for respondents to see the new template. Acceptable: seeding is a rare,
    // one-time admin action. If that staleness window becomes a problem, the fix is to
    // move these reads onto the newer "use cache" + cacheTag/updateTag APIs instead.

    return NextResponse.json({ message: 'Seed successful! IMSA Questionnaire has been created.' })
  } catch (error) {
    logger.error('Seed error', { error: error instanceof Error ? error.message : 'Unknown error' })
    return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 })
  }
}
