import type { StringId } from "@effect-app/prelude/schema"
import {
  ExtendedClass,
  FromClass,
  NonEmptyString255,
  NonEmptyString2k,
  prefixedStringId,
  S,
  useClassFeaturesForSchema
} from "@effect-app/prelude/schema"
import { UserFromId } from "./User.js"

export const BlogPostId = prefixedStringId<BlogPostId>()("post", "BlogPostId")
export interface BlogPostIdBrand {
  readonly BlogPostId: unique symbol
}
export type BlogPostId = StringId & BlogPostIdBrand & `post-${string}`

@useClassFeaturesForSchema
export class BlogPost extends ExtendedClass<BlogPost.From, BlogPost>()({
  id: BlogPostId.withDefault(),
  title: NonEmptyString255,
  body: NonEmptyString2k,
  createdAt: S.Date.withDefault(),
  author: UserFromId
    .mapFrom("authorId")
}) {}

// codegen:start {preset: model}
//
/* eslint-disable */
export namespace BlogPost {
  /**
   * @tsplus type BlogPost.From
   * @tsplus companion BlogPost.From/Ops
   */
  export class From extends FromClass<typeof BlogPost>() {}
}
/* eslint-enable */
//
// codegen:end
