import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "javarag";
const R2_FOLDER_PREFIX = process.env.R2_FOLDER_PREFIX || "helpdesk";

if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  console.warn("Cloudflare R2 environment variables are missing in .env.local");
}

export const r2Client = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID || "",
    secretAccessKey: R2_SECRET_ACCESS_KEY || "",
  },
});

export interface PresignedUrlOptions {
  fileName: string;
  contentType: string;
  folder?: string; // Subfolder inside 'helpdesk' e.g. 'documents', 'avatars'
  workspaceId?: string;
  expiresIn?: number; // Expiration time in seconds (default 3600 = 1 hour)
}

/**
 * Generates a short-lived Presigned PUT URL for direct browser-to-R2 upload.
 * Key format: helpdesk/[folder]/[workspaceId]/[timestamp]-[filename]
 */
export async function getPresignedUploadUrl({
  fileName,
  contentType,
  folder = "documents",
  workspaceId,
  expiresIn = 3600,
}: PresignedUrlOptions) {
  const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const timestamp = Date.now();

  const folderParts = [R2_FOLDER_PREFIX];
  if (folder) folderParts.push(folder);
  if (workspaceId) folderParts.push(workspaceId);

  const objectKey = `${folderParts.join("/")}/${timestamp}-${cleanFileName}`;

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: objectKey,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn });
  const publicUrl = `${R2_ENDPOINT}/${R2_BUCKET_NAME}/${objectKey}`;

  return {
    uploadUrl,
    key: objectKey,
    bucket: R2_BUCKET_NAME,
    publicUrl,
  };
}

/**
 * Deletes an object from Cloudflare R2 by key.
 */
export async function deleteFromR2(objectKey: string) {
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: objectKey,
  });

  await r2Client.send(command);
  return true;
}

/**
 * Generates the accessible public URL for a given Cloudflare R2 key.
 */
export function getR2PublicUrl(objectKey: string): string {
  if (!objectKey) return "";
  if (objectKey.startsWith("http://") || objectKey.startsWith("https://")) {
    return objectKey;
  }
  return `${R2_ENDPOINT}/${R2_BUCKET_NAME}/${objectKey}`;
}
