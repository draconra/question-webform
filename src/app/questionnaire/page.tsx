import { prisma } from '@/lib/prisma';
import { QuestionnaireService, PrismaQuestionnaireRepository } from '@/features/questionnaire';
import Wizard from '@/features/questionnaire/components/Wizard';

export const dynamic = 'force-dynamic';

export default async function QuestionnairePage() {
  const repository = new PrismaQuestionnaireRepository(prisma)
  const service = new QuestionnaireService(repository)
  const template = await service.getTemplate();

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
