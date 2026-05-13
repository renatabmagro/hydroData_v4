export class ApplicationError extends Error {
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    context?: Record<string, unknown>
  ) {
    super(message);

    this.name = "ApplicationError";
    this.context = context;
  }
}
