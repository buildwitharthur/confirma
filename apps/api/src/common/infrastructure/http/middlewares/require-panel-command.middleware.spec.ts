import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';

import { ForbiddenError } from '../../../domain/errors/forbidden.js';
import { requirePanelCommandMiddleware } from './require-panel-command.middleware.js';

describe('requirePanelCommandMiddleware unit tests', () => {
  function run(headers: Record<string, string | undefined>) {
    const next = vi.fn<NextFunction>();
    const request = {
      get: (name: string) => headers[name.toLowerCase()],
    } as Request;

    requirePanelCommandMiddleware(request, {} as Response, next);
    return next;
  }

  it('should allow a command from the configured panel origin with the custom header', () => {
    const next = run({
      origin: 'https://app.useconfirma.com.br',
      'x-requested-with': 'XMLHttpRequest',
    });

    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith();
  });

  it.each([
    {},
    {
      origin: 'https://attacker.example',
      'x-requested-with': 'XMLHttpRequest',
    },
    { origin: 'https://app.useconfirma.com.br' },
  ])(
    'should reject a command with missing or invalid origin/header',
    (headers) => {
      const next = run(headers);

      expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
    },
  );
});
