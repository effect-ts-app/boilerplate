import { BlogPostId } from "@effect-app-boilerplate/models/Blog"
import { S } from "@effect-app-boilerplate/resources/lib"
import { BlogPostView } from "../Views.js"

export class FindPostRequest extends S.Req({ allowAnonymous: true, allowRoles: ["user"] })<FindPostRequest>()({
  id: BlogPostId
}) {}

export const FindPostResponse = S.nullable(BlogPostView)
