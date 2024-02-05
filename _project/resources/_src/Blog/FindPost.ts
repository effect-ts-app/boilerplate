import { BlogPostId } from "@effect-app-boilerplate/models/Blog"
import { BlogPostView } from "../Views.js"

@allowRoles("user")
export class FindPostRequest extends Req(cfg({ allowAnonymous: true }))<FindPostRequest>()({
  id: BlogPostId
}) {}

export const FindPostResponse = nullable(BlogPostView)
