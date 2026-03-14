import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { auth } from '@/auth'

export async function GET() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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

    return NextResponse.json({ message: 'Seed successful! IMSA Questionnaire has been created.' })
  } catch (error) {
    logger.error('Seed error', { error: error instanceof Error ? error.message : 'Unknown error' })
    return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 })
  }
}
