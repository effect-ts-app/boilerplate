import { BlogPost, BlogPostId } from "@effect-app-boilerplate/models/Blog"
import { Utils } from "@effect-app/prelude"
import { struct } from "@effect-app/prelude/schema"
import { Req } from "../lib.js"

export class CreatePostRequest extends Req({ allowAnonymous: true, allowRoles: ["user"] })<CreatePostRequest>()(
  Utils.pick(BlogPost.fields, "title", "body")
) {}

export const CreatePostResponse = struct({ id: BlogPostId })
