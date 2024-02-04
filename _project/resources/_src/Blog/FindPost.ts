import { BlogPostId } from "@effect-app-boilerplate/models/Blog"
import { nullable } from "@effect-app/prelude/schema"
import { Req } from "../lib.js"
import { BlogPostView } from "../Views.js"

export class FindPostRequest extends Req({ allowAnonymous: true, allowRoles: ["user"] })<FindPostRequest>()({
  id: BlogPostId
}) {}

export const FindPostResponse = nullable(BlogPostView)
