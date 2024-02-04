import { BlogPostId } from "@effect-app-boilerplate/models/Blog"
import { S } from "@effect-app/prelude"
import { Req } from "../lib.js"
import { BlogPostView } from "../Views.js"

export class FindPostRequest extends Req({ allowAnonymous: true, allowRoles: ["user"] })<FindPostRequest>()({
  id: BlogPostId
}) {}

export const FindPostResponse = S.nullable(BlogPostView)
