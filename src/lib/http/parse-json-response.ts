export class HttpResponseParseError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "HttpResponseParseError";
    this.status = status;
  }
}

/**
 * Safari throws "The string did not match the expected pattern." when
 * `response.json()` is called on HTML or plain-text error bodies.
 */
export async function parseJsonResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  const trimmed = text.trim();

  if (!trimmed) {
    throw new HttpResponseParseError(
      response.ok
        ? "The server returned an empty response. Please try again."
        : `Request failed (${response.status}). Please try again.`,
      response.status,
    );
  }

  const contentType = response.headers.get("content-type") ?? "";
  const looksLikeJson =
    contentType.includes("application/json") ||
    trimmed.startsWith("{") ||
    trimmed.startsWith("[");

  if (!looksLikeJson) {
    throw new HttpResponseParseError(
      response.ok
        ? "Unexpected server response. Please try again."
        : `Request failed (${response.status}). Please try again.`,
      response.status,
    );
  }

  try {
    return JSON.parse(trimmed) as T;
  } catch {
    throw new HttpResponseParseError(
      response.ok
        ? "Unexpected server response. Please try again."
        : `Request failed (${response.status}). Please try again.`,
      response.status,
    );
  }
}
