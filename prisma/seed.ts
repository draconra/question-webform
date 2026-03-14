import { PrismaClient } from '@prisma/client'
import { IMSA_QUESTIONS } from '../src/features/questionnaire/data'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database with full IMSA questionnaire...')

  // Check if template already exists to prevent data loss via cascade deletes
  const existingTemplate = await prisma.formTemplate.findFirst({
    where: { title: 'IMSA Questionnaire' }
  })

  if (existingTemplate) {
    console.log('IMSA Questionnaire template already exists. Skipping seed to prevent data loss.')
    return
  }

  // Create IMSA Template
  const imsaTemplate = await prisma.formTemplate.create({
    data: {
      title: 'IMSA Questionnaire',
      description: 'International Multimorbidity and Severity Assessment (IMSA) — Kuesioner untuk menilai tingkat keparahan kondisi kesehatan Anda secara menyeluruh.',
    },
  })

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

  console.log(`Seed completed: ${IMSA_QUESTIONS.length} questions created.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
