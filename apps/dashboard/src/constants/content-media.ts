import { MAX_CONTENT_IMAGE_INPUT_BYTES } from "@/constants/content-image";
import { MAX_CONTENT_VIDEO_BYTES } from "@/constants/content-video";

/** Image and video share one upload path. Only the copy and the size cap differ. */
export const CONTENT_MEDIA = {
  image: {
    choose: "Choose an image to upload",
    failed: "Image upload failed",
    maxBytes: MAX_CONTENT_IMAGE_INPUT_BYTES,
    tooLarge: "Image must be 20MB or smaller",
  },
  video: {
    choose: "Choose a video to upload",
    failed: "Video upload failed",
    maxBytes: MAX_CONTENT_VIDEO_BYTES,
    tooLarge: "Video must be 10MB or smaller",
  },
} as const;
