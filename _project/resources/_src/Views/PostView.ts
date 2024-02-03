import { BlogPost } from "@effect-app-boilerplate/models/Blog"
import { UserViewFromId } from "../resolvers/UserResolver.js"

@useClassFeaturesForSchema
export class BlogPostView extends ExtendedClass<BlogPostView.From, BlogPostView>()({
  ...BlogPost.fields.$$.omit("author"),
  author: UserViewFromId.mapFrom("authorId")
}) {}

// codegen:start {preset: model}
//
/* eslint-disable */
export namespace BlogPostView {
  /**
   * @tsplus type BlogPostView.From
   * @tsplus companion BlogPostView.From/Ops
   */
  export class From extends FromClass<typeof BlogPostView>() {}
}
/* eslint-enable */
//
// codegen:end
