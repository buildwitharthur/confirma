import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { prismaTesting } from '../../../../../../common/infrastructure/prisma/testing/index.js';
import { AccessRequestPrismaRepository } from './access-request-prisma.repository.js';
import { SubmitPublicAccessRequest } from '../../../../domain/repositories/access-request.repository.js';

describe('AccessRequestPrismaRepository integration', () => {
  let repository: AccessRequestPrismaRepository;

  beforeAll(async () => {
    await prismaTesting.$connect();
  });

  afterAll(async () => {
    await prismaTesting.$disconnect();
  });

  beforeEach(async () => {
    await prismaTesting.accessRequest.deleteMany();
    repository = new AccessRequestPrismaRepository(prismaTesting);
  });

  function makeInput(
    overrides: Partial<SubmitPublicAccessRequest> = {},
  ): SubmitPublicAccessRequest {
    const now = new Date();

    return {
      name: 'Marina Costa',
      email: 'marina@example.com',
      companyOrProject: 'Example Clinic',
      whatsappProvider: 'evolution_api',
      intendedUse: 'Confirm pilot appointments',
      consentAt: now,
      receivedAt: now,
      updatedAt: now,
      ...overrides,
    };
  }

  it('creates a pending access request', async () => {
    const input = makeInput();

    await repository.submitPublicRequest(input);

    await expect(
      prismaTesting.accessRequest.findUniqueOrThrow({
        where: { email: input.email },
      }),
    ).resolves.toMatchObject({
      ...input,
      status: 'pending',
    });
  });

  it('updates an existing pending request without changing its identity', async () => {
    const original = await prismaTesting.accessRequest.create({
      data: makeInput({
        name: 'Original Name',
        receivedAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      }),
    });
    const update = makeInput({
      name: 'Updated Name',
      companyOrProject: 'Updated Project',
      whatsappProvider: 'other',
      intendedUse: null,
      consentAt: new Date('2026-02-01T00:00:00.000Z'),
      receivedAt: new Date('2026-02-01T00:00:00.000Z'),
      updatedAt: new Date('2026-02-01T00:00:00.000Z'),
    });

    await repository.submitPublicRequest(update);

    await expect(
      prismaTesting.accessRequest.findUniqueOrThrow({
        where: { email: update.email },
      }),
    ).resolves.toMatchObject({
      id: original.id,
      name: 'Updated Name',
      companyOrProject: 'Updated Project',
      whatsappProvider: 'other',
      intendedUse: null,
      consentAt: update.consentAt,
      receivedAt: update.receivedAt,
      updatedAt: update.updatedAt,
      status: 'pending',
    });
  });

  it.each(['invited', 'rejected'] as const)(
    'leaves a %s request unchanged on resubmission',
    async (status) => {
      const original = await prismaTesting.accessRequest.create({
        data: {
          ...makeInput({
            email: `${status}@example.com`,
            name: 'Original Name',
          }),
          status,
        },
      });

      await repository.submitPublicRequest(
        makeInput({
          email: original.email,
          name: 'Resubmitted Name',
          companyOrProject: 'New Project',
          whatsappProvider: 'none_yet',
          intendedUse: null,
        }),
      );

      await expect(
        prismaTesting.accessRequest.findUniqueOrThrow({
          where: { id: original.id },
        }),
      ).resolves.toEqual(original);
    },
  );

  it('keeps concurrent submissions for the same email as one pending request', async () => {
    const submissions = [
      makeInput({ name: 'First Submission' }),
      makeInput({ name: 'Second Submission' }),
    ];

    await Promise.all(
      submissions.map((submission) =>
        repository.submitPublicRequest(submission),
      ),
    );

    await expect(
      prismaTesting.accessRequest.findMany({
        where: { email: 'marina@example.com' },
      }),
    ).resolves.toHaveLength(1);
    await expect(
      prismaTesting.accessRequest.findUniqueOrThrow({
        where: { email: 'marina@example.com' },
      }),
    ).resolves.toMatchObject({ status: 'pending' });
  });
});
