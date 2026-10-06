import {
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  type ListObjectsV2CommandOutput,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from "@aws-sdk/client-s3";

import { getSitesR2Env } from "./env";
import { R2PreconditionFailedError } from "./errors";
import type { R2PutOptions, R2TextObject } from "./types/r2";

let client: S3Client | undefined;

function getClient(): S3Client {
  if (!client) {
    const env = getSitesR2Env();
    client = new S3Client({
      region: "auto",
      endpoint: `https://${env.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.accessKeyId,
        secretAccessKey: env.secretAccessKey,
      },
      forcePathStyle: true,
    });
  }
  return client;
}

function bucket(): string {
  return getSitesR2Env().bucket;
}

function statusOf(error: unknown): number | undefined {
  return error instanceof S3ServiceException
    ? error.$metadata.httpStatusCode
    : undefined;
}

async function* listPages(
  prefix: string,
  delimiter?: string
): AsyncGenerator<ListObjectsV2CommandOutput> {
  let continuationToken: string | undefined;
  do {
    const page = await getClient().send(
      new ListObjectsV2Command({
        Bucket: bucket(),
        Prefix: prefix,
        Delimiter: delimiter,
        ContinuationToken: continuationToken,
      })
    );
    yield page;
    continuationToken = page.IsTruncated
      ? page.NextContinuationToken
      : undefined;
  } while (continuationToken);
}

export async function r2GetText(key: string): Promise<R2TextObject | null> {
  try {
    const result = await getClient().send(
      new GetObjectCommand({ Bucket: bucket(), Key: key })
    );
    const text = (await result.Body?.transformToString()) ?? "";
    return { text, etag: result.ETag ?? "" };
  } catch (error) {
    if (
      statusOf(error) === 404 ||
      (error instanceof Error && error.name === "NoSuchKey")
    ) {
      return null;
    }
    throw error;
  }
}

export async function r2Put(
  key: string,
  body: Uint8Array | string,
  options: R2PutOptions = {}
): Promise<string> {
  try {
    const result = await getClient().send(
      new PutObjectCommand({
        Bucket: bucket(),
        Key: key,
        Body: body,
        ContentType: options.contentType,
        CacheControl: options.cacheControl,
        IfMatch: options.ifMatch,
        IfNoneMatch: options.ifNoneMatch,
      })
    );
    return result.ETag ?? "";
  } catch (error) {
    if (statusOf(error) === 412) {
      throw new R2PreconditionFailedError(`Precondition failed for ${key}`);
    }
    throw error;
  }
}

async function deleteKeys(keys: string[]): Promise<void> {
  await getClient().send(
    new DeleteObjectsCommand({
      Bucket: bucket(),
      Delete: { Objects: keys.map((key) => ({ Key: key })), Quiet: true },
    })
  );
}

export async function r2DeletePrefix(prefix: string): Promise<number> {
  let deleted = 0;
  for await (const page of listPages(prefix)) {
    const keys = (page.Contents ?? []).flatMap((object) =>
      object.Key ? [object.Key] : []
    );
    if (keys.length > 0) {
      await deleteKeys(keys);
      deleted += keys.length;
    }
  }
  return deleted;
}

export async function r2DeleteKey(key: string): Promise<void> {
  await deleteKeys([key]);
}

export async function r2ListPrefixes(prefix: string): Promise<string[]> {
  const prefixes: string[] = [];
  for await (const page of listPages(prefix, "/")) {
    for (const entry of page.CommonPrefixes ?? []) {
      if (entry.Prefix) {
        prefixes.push(entry.Prefix);
      }
    }
  }
  return prefixes;
}
