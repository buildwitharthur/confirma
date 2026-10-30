import { z } from 'zod';

import { AppError } from '../../../domain/errors/app-error.js';
import { ValidationError } from '../../../domain/errors/validation-error.js';

/**
 * Valida dados usando um schema do Zod.
 *
 * @param schema objeto com schema de validação para o Zod
 * @param body objeto com os dados a serem validados
 * @param InvalidDataError erro exigido pelo contrato da rota; por padrão, validation_error
 * @returns os dados validados e tipados pelo schema
 */
export function dataValidation<TSchema extends z.ZodType>(
  schema: TSchema,
  body: unknown,
  InvalidDataError: new (message: string) => AppError = ValidationError,
): z.infer<TSchema> {
  const validatedData = schema.safeParse(body);

  if (!validatedData.success) {
    throw new InvalidDataError(
      validatedData.error.issues
        .map((issue) => `${issue.path.join('.')} -> ${issue.message}`)
        .join(', '),
    );
  }

  return validatedData.data;
}
