import { PutObjectCommand } from "@aws-sdk/client-s3";
import { validateFlyerFile } from "@/lib/flyer/constants";
import { buildFlyerStorageKey } from "@/lib/flyer/flyer-file-name";
import { buildFlyerPublicUrl, getR2Client, getR2Config } from "@/lib/r2/client";

interface UploadFlyerInput {
  fileName: string;
  originalFileName?: string;
  contentType: string;
  size: number;
  body: Buffer;
}

function encodeOriginalFileName(fileName: string) {
  return encodeURIComponent(fileName.slice(0, 512));
}

export async function uploadFlyerToR2({
  fileName,
  originalFileName,
  contentType,
  size,
  body,
}: UploadFlyerInput) {
  const validationError = validateFlyerFile({
    name: fileName,
    type: contentType,
    size,
  } as File);

  if (validationError) {
    throw new Error(validationError);
  }

  const displayName = originalFileName?.trim() || fileName.trim() || "flyer";
  const key = buildFlyerStorageKey(fileName, contentType);
  const client = getR2Client();
  const { bucketName } = getR2Config();

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: body,
        ContentType: contentType,
        Metadata: {
          originalfilename: encodeOriginalFileName(displayName),
        },
      }),
    );
  } catch (error) {
    console.error("[upload-flyer] R2 PutObject failed:", {
      key,
      contentType,
      size,
      originalFileName: displayName,
      error,
    });
    throw error;
  }

  return {
    key,
    url: buildFlyerPublicUrl(key),
    originalFileName: displayName,
  };
}
