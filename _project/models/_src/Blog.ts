import { prefixedStringId } from "@effect-app/prelude/schema"
import { UserFromId } from "./User.js"

export const BlogPostId = prefixedStringId<BlogPostId>()("post", "BlogPostId")
export interface BlogPostIdBrand {
  readonly BlogPostId: unique symbol
}
export type BlogPostId = StringId & BlogPostIdBrand & `post-${string}`

// // Workaround for compiler blowing up in editor, if we don't manually type annotate this :S
// const user:
//   & Schema<UserFromId, string, User>
//   & S.ConstructorPropertyDescriptor<UserFromId, string, User>
//   & S.MapFromPropertyDescriptor<UserFromId, string, User, "userId"> = UserFromId
//     .mapFrom("userId")

@useClassFeaturesForSchema
export class BlogPost extends ExtendedClass<BlogPost.From, BlogPost>()({
  id: BlogPostId.withDefault(),
  title: NonEmptyString255,
  body: NonEmptyString2k,
  createdAt: S.Date.withDefault(),
  user: UserFromId
    .mapFrom("userId")
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
