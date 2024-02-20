import { BlogPost, BlogPostId } from "models/Blog"
import { S } from "resources/lib"

export class CreatePostRequest extends S.Req({ allowAnonymous: true, allowRoles: ["user"] })<CreatePostRequest>()(
  BlogPost.pick("title", "body")
) {}

export const CreatePostResponse = S.struct({ id: BlogPostId })
