import { FormTemplate, Question, Answer } from '@prisma/client'

export type FormTemplateWithQuestions = FormTemplate & {
  questions: Question[]
}

export type QuestionOption = {
  label: string
  value: string | number
}

export type ParsedQuestion = Omit<Question, 'options'> & {
  options: QuestionOption[] | null
}

export type ParsedFormTemplate = Omit<FormTemplate, 'questions'> & {
  questions: ParsedQuestion[]
}
