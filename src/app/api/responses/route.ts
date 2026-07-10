import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { QuestionnaireService, PrismaQuestionnaireRepository } from '@/features/questionnaire'
import { randomUUID } from 'crypto'

const MAX_INISIAL_LEN = 10
const MAX_ANSWER_VALUE_LEN = 500
const MAX_NAMA_LEN = 100
const MAX_ALAMAT_LEN = 300
const MAX_NO_TELP_LEN = 30
const MAX_SIGNATURE_LEN = 400_000 // ~300 KB base64 PNG

type ValidatedBody = {
  formTemplateId: string
  inisial: string
  nama?: string
  alamat?: string
  noTelp?: string
  signature?: string
  answers: { questionId: string; value: string }[]
}

function validateBody(body: unknown): ValidatedBody {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw Object.assign(new Error('Payload tidak valid'), { validation: true })
  }
  const b = body as Record<string, unknown>

  if (typeof b.formTemplateId !== 'string' || !b.formTemplateId.trim()) {
    throw Object.assign(new Error('formTemplateId wajib diisi'), { validation: true })
  }
  if (typeof b.inisial !== 'string' || !b.inisial.trim()) {
    throw Object.assign(new Error('Inisial wajib diisi'), { validation: true })
  }
  if (b.inisial.length > MAX_INISIAL_LEN) {
    throw Object.assign(new Error(`Inisial maksimal ${MAX_INISIAL_LEN} karakter`), { validation: true })
  }

  let nama: string | undefined
  if (b.nama !== undefined) {
    if (typeof b.nama !== 'string') {
      throw Object.assign(new Error('nama harus berupa string'), { validation: true })
    }
    if (b.nama.length > MAX_NAMA_LEN) {
      throw Object.assign(new Error(`Nama maksimal ${MAX_NAMA_LEN} karakter`), { validation: true })
    }
    nama = b.nama.trim() || undefined
  }

  let alamat: string | undefined
  if (b.alamat !== undefined) {
    if (typeof b.alamat !== 'string') {
      throw Object.assign(new Error('alamat harus berupa string'), { validation: true })
    }
    if (b.alamat.length > MAX_ALAMAT_LEN) {
      throw Object.assign(new Error(`Alamat maksimal ${MAX_ALAMAT_LEN} karakter`), { validation: true })
    }
    alamat = b.alamat.trim() || undefined
  }

  let noTelp: string | undefined
  if (b.noTelp !== undefined) {
    if (typeof b.noTelp !== 'string') {
      throw Object.assign(new Error('noTelp harus berupa string'), { validation: true })
    }
    if (b.noTelp.length > MAX_NO_TELP_LEN) {
      throw Object.assign(new Error('No telp terlalu panjang'), { validation: true })
    }
    noTelp = b.noTelp.trim() || undefined
  }

  let signature: string | undefined
  if (b.signature !== undefined) {
    if (typeof b.signature !== 'string') {
      throw Object.assign(new Error('signature harus berupa string'), { validation: true })
    }
    if (b.signature.length > MAX_SIGNATURE_LEN) {
      throw Object.assign(new Error('Ukuran tanda tangan terlalu besar'), { validation: true })
    }
    if (b.signature && !b.signature.startsWith('data:image/')) {
      throw Object.assign(new Error('Format tanda tangan tidak valid'), { validation: true })
    }
    signature = b.signature || undefined
  }

  if (!Array.isArray(b.answers)) {
    throw Object.assign(new Error('Answers wajib berupa array'), { validation: true })
  }
  for (const a of b.answers as unknown[]) {
    if (!a || typeof a !== 'object' || Array.isArray(a)) {
      throw Object.assign(new Error('Format answer tidak valid'), { validation: true })
    }
    const ans = a as Record<string, unknown>
    if (typeof ans.questionId !== 'string' || !ans.questionId.trim()) {
      throw Object.assign(new Error('questionId wajib diisi pada setiap answer'), { validation: true })
    }
    if (typeof ans.value !== 'string') {
      throw Object.assign(new Error('value wajib berupa string'), { validation: true })
    }
    if (ans.value.length > MAX_ANSWER_VALUE_LEN) {
      throw Object.assign(new Error(`Nilai jawaban terlalu panjang (maks ${MAX_ANSWER_VALUE_LEN} karakter)`), { validation: true })
    }
  }
  return {
    formTemplateId: (b.formTemplateId as string).trim(),
    inisial: (b.inisial as string).trim(),
    nama,
    alamat,
    noTelp,
    signature,
    answers: b.answers as { questionId: string; value: string }[],
  }
}

export async function POST(req: Request) {
  const correlationId = randomUUID()
  const operation = 'submit_response'
  const startTime = Date.now()

  logger.info('Operation started', { operation, correlationId })

  try {
    const rawBody = await req.json()
    const body = validateBody(rawBody)

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
        inisial: body.inisial,
        nama: body.nama,
        alamat: body.alamat,
        noTelp: body.noTelp,
        signature: body.signature,
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

    const isValidationError = (error as { validation?: boolean }).validation === true
    return NextResponse.json(
      { error: isValidationError ? message : 'Terjadi kesalahan pada server. Silakan coba lagi.' },
      { status: isValidationError ? 400 : 500 }
    )
  }
}
