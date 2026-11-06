import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { QuestionnaireService, PrismaQuestionnaireRepository } from '@/features/questionnaire';
import Wizard from '@/features/questionnaire/components/Wizard';

// Kept dynamic rather than switching to ISR (`export const revalidate = N`):
// ISR makes Next prerender this page at *build* time, which requires a reachable
// DB during the build — verified locally, this fails the build outright when the
// DB is down at build time. Caching just the data fetch gets most of the win
// (no DB round-trip on every respondent visit) without that new failure mode.
export const dynamic = 'force-dynamic';

const getCachedTemplate = unstable_cache(
  async () => {
    const repository = new PrismaQuestionnaireRepository(prisma)
    const service = new QuestionnaireService(repository)
    return service.getTemplate()
  },
  ['questionnaire-template'],
  { revalidate: 3600 }
)

export default async function QuestionnairePage() {
  const template = await getCachedTemplate();

  if (!template || template.questions.length === 0) {
    return (
      <div className="wizard-container">
        <div className="wizard-content" style={{ textAlign: 'center' }}>
          <h2>No Questionnaire Found</h2>
          <p>Please run the database seed script to populate the IMSA template.</p>
        </div>
      </div>
    );
  }

  return <Wizard template={template} />;
}
