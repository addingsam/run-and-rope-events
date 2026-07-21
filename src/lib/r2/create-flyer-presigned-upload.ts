import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { validateFlyerFile } from "@/lib/flyer/constants";
import { buildFlyerStorageKey } from "@/lib/flyer/flyer-file-name";
import { buildFlyerPublicUrl, getR2Client, getR2Config } from "@/lib/r2/client";

interface CreateFlyerPresignedUploadInput {
  fileName: string;
  originalFileName?: string;
  contentType: string;
  size: number;
}

function encodeOriginalFileName(fileName: string) {
  return encodeURIComponent(fileName.slice(0, 512));
}

export async function createFlyerPresignedUpload({
  fileName,
  originalFileName,
  contentType,
  size,
}: CreateFlyerPresignedUploadInput) {
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

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
    Metadata: {
      originalfilename: encodeOriginalFileName(displayName),
    },
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 600 });

  return {
    key,
    uploadUrl,
    url: buildFlyerPublicUrl(key),
    originalFileName: displayName,
  };
}
