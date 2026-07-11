import {
  FLYER_EXTRACTION_SYSTEM_PROMPT,
  FLYER_EXTRACTION_USER_PROMPT,
} from "@/lib/flyer/extract-flyer-prompt";
import { parseFlyerExtractionResponse } from "@/lib/flyer/parse-flyer-extraction";
import { ACCEPTED_FLYER_TYPES } from "@/lib/flyer/constants";
import type { FlyerExtractionResult } from "@/types/flyer-extraction";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_MODEL = "claude-sonnet-4-6";

type AnthropicContentBlock =
  | {
      type: "text";
      text: string;
    }
  | {
      type: "image";
      source: {
        type: "base64";
        media_type: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
        data: string;
      };
    }
  | {
      type: "document";
      source: {
        type: "base64";
        media_type: "application/pdf";
        data: string;
      };
    }
  | {
      type: "image";
      source: {
        type: "url";
        url: string;
      };
    };

interface AnthropicMessageResponse {
  content?: Array<{ type: string; text?: string }>;
  error?: { message?: string };
}

function requireAnthropicApiKey() {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY.");
  }
  return apiKey;
}

function mediaTypeFromContentType(
  contentType: string,
): "image/jpeg" | "image/png" | "application/pdf" | null {
  if (contentType === "image/jpeg" || contentType === "image/png") {
    return contentType;
  }

  if (contentType === "application/pdf") {
    return "application/pdf";
  }

  return null;
}

function mediaTypeFromFileName(fileName: string) {
  const lower = fileName.toLowerCase();

  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
    return "image/jpeg" as const;
  }

  if (lower.endsWith(".png")) {
    return "image/png" as const;
  }

  if (lower.endsWith(".pdf")) {
    return "application/pdf" as const;
  }

  return null;
}

function buildVisionContentBlock(
  mediaType: "image/jpeg" | "image/png" | "application/pdf",
  base64Data: string,
): AnthropicContentBlock {
  if (mediaType === "application/pdf") {
    return {
      type: "document",
      source: {
        type: "base64",
        media_type: "application/pdf",
        data: base64Data,
      },
    };
  }

  return {
    type: "image",
    source: {
      type: "base64",
      media_type: mediaType,
      data: base64Data,
    },
  };
}

async function callAnthropicVision(content: AnthropicContentBlock[]) {
  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": requireAnthropicApiKey(),
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 1500,
      system: FLYER_EXTRACTION_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [...content, { type: "text", text: FLYER_EXTRACTION_USER_PROMPT }],
        },
      ],
    }),
  });

  const data = (await response.json()) as AnthropicMessageResponse;

  if (!response.ok) {
    throw new Error(data.error?.message ?? "Anthropic API request failed.");
  }

  const text = data.content
    ?.filter((block) => block.type === "text" && block.text)
    .map((block) => block.text)
    .join("\n")
    .trim();

  if (!text) {
    throw new Error("Anthropic returned an empty response.");
  }

  return parseFlyerExtractionResponse(text);
}

export async function extractFlyerFromUrl(flyerUrl: string): Promise<FlyerExtractionResult> {
  const response = await fetch(flyerUrl);

  if (!response.ok) {
    throw new Error("Could not fetch the uploaded flyer for extraction.");
  }

  const contentType = response.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
  const mediaType = mediaTypeFromContentType(contentType);

  if (!mediaType) {
    throw new Error("Flyer must be a JPEG, PNG, or PDF file for extraction.");
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const base64Data = buffer.toString("base64");

  return callAnthropicVision([buildVisionContentBlock(mediaType, base64Data)]);
}

export async function extractFlyerFromFile(file: File): Promise<FlyerExtractionResult> {
  if (!ACCEPTED_FLYER_TYPES.includes(file.type as (typeof ACCEPTED_FLYER_TYPES)[number])) {
    throw new Error("Flyer must be a JPEG, PNG, or PDF file for extraction.");
  }

  const mediaType =
    mediaTypeFromContentType(file.type) ?? mediaTypeFromFileName(file.name);

  if (!mediaType) {
    throw new Error("Flyer must be a JPEG, PNG, or PDF file for extraction.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64Data = buffer.toString("base64");

  return callAnthropicVision([buildVisionContentBlock(mediaType, base64Data)]);
}
