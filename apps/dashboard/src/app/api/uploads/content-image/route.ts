import { ORPCError } from "@orpc/server";
import { NextResponse } from "next/server";

import { MAX_CONTENT_IMAGE_INPUT_BYTES } from "@/constants/content-image";
import { MAX_CONTENT_VIDEO_BYTES } from "@/constants/content-video";
import { uploadContentImage, uploadContentVideo } from "@/lib/upload/server";

export const runtime = "nodejs";
export const maxDuration = 30;

function errorResponse(error: unknown, video: boolean) {
  if (error instanceof ORPCError) {
    return NextResponse.json(
      { message: error.message },
      { status: error.status }
    );
  }
  console.error("Content upload failed", error);
  return NextResponse.json(
    { message: video ? "Video upload failed" : "Image upload failed" },
    { status: 500 }
  );
}

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { message: "Choose an image to upload" },
      { status: 400 }
    );
  }

  const file = form.get("file");
  const video = form.get("kind") === "video";
  if (!(file instanceof File)) {
    return NextResponse.json(
      {
        message: video
          ? "Choose a video to upload"
          : "Choose an image to upload",
      },
      { status: 400 }
    );
  }
  if (video && file.size > MAX_CONTENT_VIDEO_BYTES) {
    return NextResponse.json(
      { message: "Video must be 10MB or smaller" },
      { status: 400 }
    );
  }
  if (!video && file.size > MAX_CONTENT_IMAGE_INPUT_BYTES) {
    return NextResponse.json(
      { message: "Image must be 20MB or smaller" },
      { status: 400 }
    );
  }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const uploaded = video
      ? await uploadContentVideo({ bytes, headers: request.headers })
      : await uploadContentImage({ bytes, headers: request.headers });
    return NextResponse.json(uploaded);
  } catch (error) {
    return errorResponse(error, video);
  }
}
