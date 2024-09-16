import { OperationId } from "effect-app/Operations"
import { BlogPost, BlogPostId } from "models/Blog.js"
import { S } from "./lib.js"
import { BlogPostView } from "./Views.js"

export class CreatePost extends S.Req<CreatePost>()(
  BlogPost.pick("title", "body"),
  { allowAnonymous: true, allowRoles: ["user"], success: S.Struct({ id: BlogPostId }) }
) {}

export class FindPost extends S.Req<FindPost>()({
  id: BlogPostId
}, { allowAnonymous: true, allowRoles: ["user"], success: S.NullOr(BlogPostView) }) {}

export class GetPosts extends S.Req<GetPosts>()({}, {
  allowAnonymous: true,
  allowRoles: ["user"],
  success: S.Struct({
    items: S.Array(BlogPostView)
  })
}) {}

export class PublishPost extends S.Req<PublishPost>()({
  id: BlogPostId
}, { allowAnonymous: true, allowRoles: ["user"], success: OperationId }) {}

// codegen:start {preset: meta, sourcePrefix: src/resources/}
export const meta = { moduleName: "Blog" }
// codegen:end
