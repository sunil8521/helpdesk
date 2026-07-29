import { NextResponse } from "next/server";
import { getPresignedUploadUrl } from "@/lib/r2";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fileName, contentType, folder, workspaceId } = body;

    if (!fileName || !contentType) {
      return NextResponse.json(
        { error: "fileName and contentType are required fields" },
        { status: 400 }
      );
    }

    const data = await getPresignedUploadUrl({
      fileName,
      contentType,
      folder: folder || "documents",
      workspaceId,
    });

    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (error: any) {
    console.error("Presigned URL generation error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate presigned upload URL" },
      { status: 500 }
    );
  }
}
