import createClient from 'openapi-fetch';
import type { paths } from './generated/openapi';

export const apiClient = createClient<paths>({
	baseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3333',
	credentials: 'include',
	// Exigido pela API nos comandos autenticados (proteção anti-CSRF de docs/specs/api.md).
	headers: { 'X-Requested-With': 'XMLHttpRequest' },
});
