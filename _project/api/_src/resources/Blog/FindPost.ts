import { BlogPostId } from "@effect-app-boilerplate/api/models/Blog"
import { S } from "@effect-app-boilerplate/api/resources/lib"
import { BlogPostView } from "../Views.js"

export class FindPostRequest extends S.Req({ allowAnonymous: true, allowRoles: ["user"] })<FindPostRequest>()({
  id: BlogPostId
}) {}

export const FindPostResponse = S.nullable(BlogPostView)
