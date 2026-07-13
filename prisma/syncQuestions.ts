import { PrismaClient } from '@prisma/client'
import { IMSA_QUESTIONS } from '../src/features/questionnaire/data'

const prisma = new PrismaClient()

/**
 * Idempotent content sync — pushes prompt/option edits from data.ts into an
 * already-seeded database WITHOUT touching existing responses.
 * (`prisma db seed` only creates the template once and skips silently if it
 * already exists, so editing data.ts alone never reaches a live DB.)
 */
async function main() {
  const template = await prisma.formTemplate.findFirst({
    where: { title: 'IMSA Questionnaire' },
  })

  if (!template) {
    console.log('No IMSA Questionnaire template found — run `npm run seed` first.')
    return
  }

  let updated = 0
  let created = 0

  for (const q of IMSA_QUESTIONS) {
    const result = await prisma.question.updateMany({
      where: { formTemplateId: template.id, variableName: q.variableName },
      data: {
        type: q.type,
        prompt: q.prompt,
        options: q.options ? JSON.stringify(q.options) : null,
        orderIndex: q.orderIndex,
        required: q.required,
      },
    })

    if (result.count > 0) {
      updated++
    } else {
      // Question didn't exist yet (e.g. newly added to data.ts) — create it.
      await prisma.question.create({
        data: {
          variableName: q.variableName,
          type: q.type,
          prompt: q.prompt,
          options: q.options ? JSON.stringify(q.options) : null,
          orderIndex: q.orderIndex,
          required: q.required,
          formTemplateId: template.id,
        },
      })
      created++
    }
  }

  console.log(`Sync completed: ${updated} question(s) updated, ${created} created.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
