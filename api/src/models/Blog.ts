import { S } from "effect-app"
import { UserFromId } from "./User"

export const BlogPostId = S.prefixedStringId<BlogPostId>()("post", "BlogPostId")
export interface BlogPostIdBrand {
  readonly BlogPostId: unique symbol
}
export type BlogPostId = S.StringId & BlogPostIdBrand & `post-${string}`

export class BlogPost extends S.ExtendedClass<BlogPost, BlogPost.From>()({
  id: BlogPostId.withDefault,
  title: S.NonEmptyString255,
  body: S.NonEmptyString2k,
  createdAt: S.Date.withDefault,
  author: UserFromId.pipe(S.mapFrom("authorId"))
}) {}

// codegen:start {preset: model}
//
/* eslint-disable */
export namespace BlogPost {
  export class From extends S.FromClass<typeof BlogPost>() {}
}
/* eslint-enable */
//
// codegen:end
