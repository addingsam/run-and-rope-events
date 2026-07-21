import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  type CompletedPart,
} from "@aws-sdk/client-s3";
import { validateFlyerFile } from "@/lib/flyer/constants";
import { buildFlyerStorageKey } from "@/lib/flyer/flyer-file-name";
import { buildFlyerPublicUrl, getR2Client, getR2Config } from "@/lib/r2/client";

export interface InitMultipartFlyerUploadInput {
  fileName: string;
  originalFileName?: string;
  contentType: string;
  size: number;
}

export interface MultipartFlyerUploadPartInput {
  key: string;
  uploadId: string;
  partNumber: number;
  body: Buffer;
}

export interface CompleteMultipartFlyerUploadInput {
  key: string;
  uploadId: string;
  parts: CompletedPart[];
}

function encodeOriginalFileName(fileName: string) {
  return encodeURIComponent(fileName.slice(0, 512));
}

function validateFlyerUploadInput(input: InitMultipartFlyerUploadInput) {
  const validationError = validateFlyerFile({
    name: input.fileName,
    type: input.contentType,
    size: input.size,
  } as File);

  if (validationError) {
    throw new Error(validationError);
  }
}

export async function initMultipartFlyerUpload(input: InitMultipartFlyerUploadInput) {
  validateFlyerUploadInput(input);

  const displayName = input.originalFileName?.trim() || input.fileName.trim() || "flyer";
  const key = buildFlyerStorageKey(input.fileName, input.contentType);
  const client = getR2Client();
  const { bucketName } = getR2Config();

  const response = await client.send(
    new CreateMultipartUploadCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: input.contentType,
      Metadata: {
        originalfilename: encodeOriginalFileName(displayName),
      },
    }),
  );

  if (!response.UploadId) {
    throw new Error("Could not start flyer upload.");
  }

  return {
    key,
    uploadId: response.UploadId,
    url: buildFlyerPublicUrl(key),
    originalFileName: displayName,
  };
}

export async function uploadMultipartFlyerPart(input: MultipartFlyerUploadPartInput) {
  if (!Number.isInteger(input.partNumber) || input.partNumber < 1 || input.partNumber > 10_000) {
    throw new Error("Invalid upload part number.");
  }

  const client = getR2Client();
  const { bucketName } = getR2Config();

  const response = await client.send(
    new UploadPartCommand({
      Bucket: bucketName,
      Key: input.key,
      UploadId: input.uploadId,
      PartNumber: input.partNumber,
      Body: input.body,
    }),
  );

  if (!response.ETag) {
    throw new Error("Flyer upload part failed.");
  }

  return {
    partNumber: input.partNumber,
    etag: response.ETag,
  };
}

export async function completeMultipartFlyerUpload(input: CompleteMultipartFlyerUploadInput) {
  if (input.parts.length === 0) {
    throw new Error("Flyer upload is missing file parts.");
  }

  const client = getR2Client();
  const { bucketName } = getR2Config();
  const parts = [...input.parts].sort((left, right) => left.PartNumber! - right.PartNumber!);

  await client.send(
    new CompleteMultipartUploadCommand({
      Bucket: bucketName,
      Key: input.key,
      UploadId: input.uploadId,
      MultipartUpload: { Parts: parts },
    }),
  );

  return {
    key: input.key,
    url: buildFlyerPublicUrl(input.key),
  };
}

export async function abortMultipartFlyerUpload(key: string, uploadId: string) {
  const client = getR2Client();
  const { bucketName } = getR2Config();

  await client.send(
    new AbortMultipartUploadCommand({
      Bucket: bucketName,
      Key: key,
      UploadId: uploadId,
    }),
  );
}
