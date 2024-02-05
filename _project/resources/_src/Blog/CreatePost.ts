import { BlogPost, BlogPostId } from "@effect-app-boilerplate/models/Blog"
import { S } from "@effect-app-boilerplate/resources/lib"

export class CreatePostRequest extends S.Req({ allowAnonymous: true, allowRoles: ["user"] })<CreatePostRequest>()(
  BlogPost.pick("title", "body")
) {}

export const CreatePostResponse = S.struct({ id: BlogPostId })
