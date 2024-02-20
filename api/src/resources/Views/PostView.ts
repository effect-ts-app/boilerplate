import { BlogPost } from "models/Blog"
import { S } from "resources/lib"
import { UserViewFromId } from "../resolvers/UserResolver"

export class BlogPostView extends S.ExtendedClass<BlogPostView, BlogPostView.From>()({
  ...BlogPost.omit("author"),
  author: UserViewFromId.pipe(S.mapFrom("authorId"))
}) {}

// codegen:start {preset: model}
//
/* eslint-disable */
export namespace BlogPostView {
  export class From extends S.FromClass<typeof BlogPostView>() {}
}
/* eslint-enable */
//
// codegen:end
