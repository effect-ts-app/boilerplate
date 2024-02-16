import { BlogPost } from "@effect-app-boilerplate/api/models/Blog"
import { S } from "@effect-app-boilerplate/api/resources/lib"
import { UserViewFromId } from "../resolvers/UserResolver.js"

export class BlogPostView extends S.ExtendedClass<BlogPostView, BlogPostView.From>()({
  ...BlogPost.omit("author"),
  author: UserViewFromId.pipe(S.mapFrom("authorId"))
}) {}

// codegen:start {preset: model}
//
/* eslint-disable */
export namespace BlogPostView {
  /**
   * @tsplus type BlogPostView.From
   * @tsplus companion BlogPostView.From/Ops
   */
  export class From extends S.FromClass<typeof BlogPostView>() {}
}
/* eslint-enable */
//
// codegen:end
