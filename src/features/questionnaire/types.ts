import { FormTemplate, Question, Answer } from '@prisma/client'

export type FormTemplateWithQuestions = FormTemplate & {
  questions: Question[]
}

export type QuestionOption = {
  label: string
  value: string | number
  /** When true, selecting this option shows a required free-text companion input. */
  requiresText?: boolean
}

export type ParsedQuestion = Omit<Question, 'options'> & {
  options: QuestionOption[] | null
}

export type ParsedFormTemplate = Omit<FormTemplate, 'questions'> & {
  questions: ParsedQuestion[]
}
