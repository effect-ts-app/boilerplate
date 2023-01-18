import { prefixedStringId } from "@effect-app/prelude/schema"

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
  createdAt: S.Date.withDefault()
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
