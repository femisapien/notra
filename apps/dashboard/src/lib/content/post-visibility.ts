import { posts } from "@notra/db/schema";
import { sql } from "drizzle-orm";

export function postsVisibleToUser(userId: string) {
  return sql`(${posts.visibility} <> 'private' or ${posts.createdByUserId} = ${userId})`;
}
