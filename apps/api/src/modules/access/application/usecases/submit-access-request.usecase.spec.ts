import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { SubmissionRejectedError } from '../../../../common/domain/errors/submission-rejected.js';
import { prismaTesting } from '../../../../common/infrastructure/prisma/testing/index.js';
import { AccessRequestPrismaRepository } from '../../infrastructure/http/prisma/repositories/access-request-prisma.repository.js';
import { SubmitAccessRequestUseCase } from './submit-access-request.usecase.js';

describe('SubmitAccessRequestUseCase integration', () => {
  let useCase: SubmitAccessRequestUseCase;

  beforeAll(async () => {
    await prismaTesting.$connect();
  });

  afterAll(async () => {
    await prismaTesting.$disconnect();
  });

  beforeEach(async () => {
    await prismaTesting.accessRequest.deleteMany();
    useCase = new SubmitAccessRequestUseCase(
      new AccessRequestPrismaRepository(prismaTesting),
    );
  });

  function makeInput(overrides: Record<string, unknown> = {}) {
    return {
      name: 'Marina Costa',
      email: '  MARINA@EXAMPLE.COM ',
      companyOrProject: 'Example Clinic',
      whatsappProvider: 'evolution_api' as const,
      intendedUse: 'Confirm pilot appointments',
      consentAt: new Date('2026-10-19T12:00:00.000Z'),
      formOpenedAt: new Date(Date.now() - 10_000),
      website: '',
      ...overrides,
    };
  }

  it('normalizes the email and persists a pending request', async () => {
    await expect(useCase.execute(makeInput())).resolves.toBeUndefined();

    await expect(
      prismaTesting.accessRequest.findUniqueOrThrow({
        where: { email: 'marina@example.com' },
      }),
    ).resolves.toMatchObject({
      name: 'Marina Costa',
      email: 'marina@example.com',
      companyOrProject: 'Example Clinic',
      whatsappProvider: 'evolution_api',
      intendedUse: 'Confirm pilot appointments',
      status: 'pending',
    });
  });

  it('rejects a non-empty honeypot without persisting a request', async () => {
    await expect(
      useCase.execute(makeInput({ website: 'bot-submission' })),
    ).rejects.toBeInstanceOf(SubmissionRejectedError);
    await expect(prismaTesting.accessRequest.count()).resolves.toBe(0);
  });

  it('rejects a form submitted too quickly without persisting a request', async () => {
    await expect(
      useCase.execute(
        makeInput({ formOpenedAt: new Date(Date.now() - 2_000) }),
      ),
    ).rejects.toBeInstanceOf(SubmissionRejectedError);
    await expect(prismaTesting.accessRequest.count()).resolves.toBe(0);
  });
});
