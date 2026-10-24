export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(message: string, statusCode = 400, code = 'bad_request') {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
  }
}
