import { BlogPost } from "@effect-app-boilerplate/models/Blog"
import { S, Utils } from "@effect-app/prelude"
import { ExtendedClass, FromClass, useClassFeaturesForSchema } from "@effect-app/prelude/schema"
import { UserViewFromId } from "../resolvers/UserResolver.js"

@useClassFeaturesForSchema
export class BlogPostView extends ExtendedClass<BlogPostView.From, BlogPostView>()({
  ...Utils.omit(BlogPost.fields, "author"),
  author: S.mapFrom(UserViewFromId, "authorId")
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
