import { BlogPost, BlogPostId } from "models/Blog.js"
import { S } from "resources/lib.js"

export class CreatePostRequest extends S.Req({ allowAnonymous: true, allowRoles: ["user"] })<CreatePostRequest>()(
  BlogPost.pick("title", "body")
) {}

export const CreatePostResponse = S.Struct({ id: BlogPostId })
