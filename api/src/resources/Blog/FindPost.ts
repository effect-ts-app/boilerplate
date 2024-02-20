import { BlogPostId } from "models/Blog"
import { S } from "resources/lib"
import { BlogPostView } from "../Views"

export class FindPostRequest extends S.Req({ allowAnonymous: true, allowRoles: ["user"] })<FindPostRequest>()({
  id: BlogPostId
}) {}

export const FindPostResponse = S.nullable(BlogPostView)
