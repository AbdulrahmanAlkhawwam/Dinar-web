export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly messages: string[],
    readonly fieldErrors: Record<string, string>,
  ) {
    super(messages[0]);
    this.name = 'ApiError';
  }
}

function readMessages(status: number, body: unknown): string[] {
  const message =
    typeof body === 'object' && body !== null
      ? (body as { message?: unknown }).message
      : undefined;

  if (typeof message === 'string') {
    return [message];
  }
  if (Array.isArray(message) && message.every((m) => typeof m === 'string')) {
    return message;
  }
  return [`Something went wrong (${status})`];
}

/**
 * Normalises a Nest error body. `message` is a string for most errors and a
 * string array from ValidationPipe; either way each message is matched to a
 * form field when it names one — class-validator's `price must be…`, or the
 * BFF's `price: …`.
 */
export function toApiError(
  status: number,
  body: unknown,
  fields: readonly string[] = [],
): ApiError {
  const messages = readMessages(status, body);
  const fieldErrors: Record<string, string> = {};

  for (const message of messages) {
    for (const field of fields) {
      if (field in fieldErrors) {
        continue;
      }
      if (message.startsWith(`${field}: `)) {
        fieldErrors[field] = message.slice(field.length + 2);
      } else if (message.startsWith(`${field} `)) {
        fieldErrors[field] = message;
      }
    }
  }

  return new ApiError(status, messages, fieldErrors);
}
