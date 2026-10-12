import { IMAGE_MIME_TYPES, IMAGE_URL_EXTENSION } from "../constants/seo";

/** MIME type from the URL's file extension, when it is a known image type. */
export function imageMimeType(url: string): string | undefined {
  const { pathname } = new URL(url);
  const extension = IMAGE_URL_EXTENSION.exec(pathname)?.[1]?.toLowerCase();
  return extension ? IMAGE_MIME_TYPES[extension] : undefined;
}
