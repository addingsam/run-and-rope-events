export class HttpResponseParseError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "HttpResponseParseError";
    this.status = status;
  }
}

function messageForFailedResponse(status: number, context: "upload" | "submit" | "extract" | "default" = "default") {
  if (status === 413) {
    if (context === "upload") {
      return "Flyer file is too large for server upload. Retrying direct storage upload.";
    }
    if (context === "submit") {
      return "Submission is too large. Shorten the description or entry details and try again.";
    }
    return "Request is too large for the server. Use a smaller flyer or shorten long text fields.";
  }

  return `Request failed (${status}). Please try again.`;
}

/**
 * Safari throws "The string did not match the expected pattern." when
 * `response.json()` is called on HTML or plain-text error bodies.
 */
export async function parseJsonResponse<T>(
  response: Response,
  context: "upload" | "submit" | "extract" | "default" = "default",
): Promise<T> {
  const text = await response.text();
  const trimmed = text.trim();

  if (!trimmed) {
    throw new HttpResponseParseError(
      response.ok
        ? "The server returned an empty response. Please try again."
        : messageForFailedResponse(response.status, context),
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
        : messageForFailedResponse(response.status, context),
      response.status,
    );
  }

  try {
    return JSON.parse(trimmed) as T;
  } catch {
    throw new HttpResponseParseError(
      response.ok
        ? "Unexpected server response. Please try again."
        : messageForFailedResponse(response.status, context),
      response.status,
    );
  }
}
