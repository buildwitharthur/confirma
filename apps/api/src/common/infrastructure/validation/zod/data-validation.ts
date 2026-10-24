import { z } from 'zod';

import { AppError } from '../../../domain/errors/app-error.js';

/**
 * Valida dados usando um schema do Zod.
 *
 * @param schema objeto com schema de validação para o Zod
 * @param body objeto com os dados a serem validados
 * @returns os dados validados e tipados pelo schema
 */
export function dataValidation<TSchema extends z.ZodType>(
	schema: TSchema,
	body: unknown,
): z.infer<TSchema> {
	const validatedData = schema.safeParse(body);

	if (!validatedData.success) {
		console.error('Invalid data', validatedData.error.format());
		throw new AppError(
			validatedData.error.issues
				.map((issue) => `${issue.path.join('.')} -> ${issue.message}`)
				.join(', '),
		);
	}

	return validatedData.data;
}
