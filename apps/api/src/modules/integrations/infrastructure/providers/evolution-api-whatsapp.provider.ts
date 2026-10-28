import { AppError } from '../../../../common/domain/errors/app-error.js';
import { ServiceUnavailableError } from '../../../../common/domain/errors/service-unavailable.js';
import type {
  TestWhatsAppConnectionInput,
  TestWhatsAppConnectionResult,
  WhatsAppProvider,
} from '../../domain/providers/whatsapp-provider.js';

export class EvolutionApiWhatsAppProvider implements WhatsAppProvider {
  constructor(
    private readonly baseUrl: string,
    private readonly fetcher: typeof fetch = fetch,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async testConnection(
    input: TestWhatsAppConnectionInput,
  ): Promise<TestWhatsAppConnectionResult> {
    try {
      const signal = AbortSignal.timeout(10_000);
      const versionResponse = await this.request(
        '/',
        input.sendCredentials,
        signal,
      );
      const versionBody = await versionResponse.json();
      const providerVersion =
        typeof versionBody === 'object' &&
        versionBody !== null &&
        'version' in versionBody &&
        typeof versionBody.version === 'string'
          ? versionBody.version
          : null;

      if (!providerVersion) {
        throw new Error('Evolution API version response is invalid.');
      }

      const stateResponse = await this.request(
        `/instance/connectionState/${encodeURIComponent(input.instanceIdentifier)}`,
        input.sendCredentials,
        signal,
      );
      const stateBody = await stateResponse.json();
      const state =
        typeof stateBody === 'object' &&
        stateBody !== null &&
        'instance' in stateBody &&
        typeof stateBody.instance === 'object' &&
        stateBody.instance !== null &&
        'state' in stateBody.instance &&
        typeof stateBody.instance.state === 'string'
          ? stateBody.instance.state
          : null;

      if (state !== 'open') {
        throw new AppError(
          'A instância WhatsApp não está conectada.',
          502,
          'service_unavailable',
        );
      }

      return { providerVersion, checkedAt: this.now() };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new ServiceUnavailableError(
        'Não foi possível testar a conexão WhatsApp.',
      );
    }
  }

  private async request(
    path: string,
    apiKey: string,
    signal: AbortSignal,
  ): Promise<Response> {
    const response = await this.fetcher(new URL(path, this.baseUrl), {
      headers: { apikey: apiKey },
      signal,
    });
    if (!response.ok) {
      throw new AppError(
        response.status === 401
          ? 'Credenciais da conexão WhatsApp inválidas.'
          : 'Não foi possível testar a conexão WhatsApp.',
        502,
        'service_unavailable',
      );
    }
    return response;
  }
}
