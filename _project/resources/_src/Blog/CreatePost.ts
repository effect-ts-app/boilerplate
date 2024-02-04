import { BlogPost, BlogPostId } from "@effect-app-boilerplate/models/Blog"
import { S, Utils } from "@effect-app/prelude"
import { Req } from "../lib.js"

export class CreatePostRequest extends Req({ allowAnonymous: true, allowRoles: ["user"] })<CreatePostRequest>()(
  Utils.pick(BlogPost.fields, "title", "body")
) {}

export const CreatePostResponse = S.struct({ id: BlogPostId })
