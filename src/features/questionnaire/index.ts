/**
 * Public API of the questionnaire feature.
 * Only import from here — never from internal files like service.ts or repository.ts directly.
 */
export { QuestionnaireService } from './service'
export { PrismaQuestionnaireRepository } from './repository'
export type { QuestionnaireRepository, FormTemplateWithQuestions, AnalyticsQuestion } from './repository'
export type { SubmitAnswersInput } from './service'
