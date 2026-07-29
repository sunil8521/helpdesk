export interface DirectUploadParams {
  file: File;
  folder?: "documents" | "avatars" | "logos";
  workspaceId?: string;
  onProgress?: (percentage: number) => void;
}

export interface DirectUploadResult {
  key: string;
  publicUrl: string;
  bucket: string;
}


export async function uploadFileDirectToR2({
  file,
  folder = "documents",
  workspaceId,
}: DirectUploadParams): Promise<DirectUploadResult> {
  // Step 1: Request presigned upload URL from server API
  const presignResponse = await fetch("/api/upload/presigned", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
      folder,
      workspaceId,
    }),
  });

  if (!presignResponse.ok) {
    const errorData = await presignResponse.json();
    throw new Error(errorData.error || "Failed to obtain upload authorization");
  }

  const { uploadUrl, key, publicUrl, bucket } = await presignResponse.json();

  // Step 2: Directly upload binary payload from client browser to Cloudflare R2
  const r2UploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  });

  if (!r2UploadResponse.ok) {
    throw new Error(`Direct R2 upload failed with status ${r2UploadResponse.status}`);
  }

  return {
    key,
    publicUrl,
    bucket,
  };
}
