import { BlogPost, BlogPostId } from "@effect-app-boilerplate/models/Blog"
import { struct } from "@effect-app/prelude/schema"
import { Req } from "../lib.js"

export class CreatePostRequest extends Req({ allowAnonymous: true, allowRoles: ["user"] })<CreatePostRequest>()(
  BlogPost.fields.$$.pick("title", "body")
) {}

export const CreatePostResponse = struct({ id: BlogPostId })
