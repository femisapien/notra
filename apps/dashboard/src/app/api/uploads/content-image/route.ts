import { ORPCError } from "@orpc/server";
import { NextResponse } from "next/server";

import { MAX_CONTENT_IMAGE_INPUT_BYTES } from "@/constants/content-image";
import { uploadContentImage } from "@/lib/upload/server";

export const runtime = "nodejs";
export const maxDuration = 30;

function errorResponse(error: unknown) {
  if (error instanceof ORPCError) {
    return NextResponse.json(
      { message: error.message },
      { status: error.status }
    );
  }
  console.error("Content image upload failed", error);
  return NextResponse.json({ message: "Image upload failed" }, { status: 500 });
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
  if (!(file instanceof File)) {
    return NextResponse.json(
      { message: "Choose an image to upload" },
      { status: 400 }
    );
  }
  if (file.size > MAX_CONTENT_IMAGE_INPUT_BYTES) {
    return NextResponse.json(
      { message: "Image must be 20MB or smaller" },
      { status: 400 }
    );
  }

  try {
    const uploaded = await uploadContentImage({
      bytes: new Uint8Array(await file.arrayBuffer()),
      headers: request.headers,
    });
    return NextResponse.json(uploaded);
  } catch (error) {
    return errorResponse(error);
  }
}
