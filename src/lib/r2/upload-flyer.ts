import { PutObjectCommand } from "@aws-sdk/client-s3";
import { sanitizeFlyerFileName, validateFlyerFile } from "@/lib/flyer/constants";
import { buildFlyerPublicUrl, getR2Client, getR2Config } from "@/lib/r2/client";

interface UploadFlyerInput {
  fileName: string;
  contentType: string;
  size: number;
  body: Buffer;
}

export async function uploadFlyerToR2({ fileName, contentType, size, body }: UploadFlyerInput) {
  const validationError = validateFlyerFile({
    name: fileName,
    type: contentType,
    size,
  } as File);

  if (validationError) {
    throw new Error(validationError);
  }

  const key = `flyers/${crypto.randomUUID()}-${sanitizeFlyerFileName(fileName)}`;
  const client = getR2Client();
  const { bucketName } = getR2Config();

  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );

  return {
    key,
    url: buildFlyerPublicUrl(key),
  };
}
