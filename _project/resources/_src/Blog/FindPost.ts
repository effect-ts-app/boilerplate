import { BlogPost, BlogPostId } from "@effect-app-boilerplate/models/Blog"

@allowRoles("user")
export class FindPostRequest extends Req(cfg({ allowAnonymous: true }))<FindPostRequest>()({
  id: BlogPostId
}) {}

export const FindPostResponse = nullable(BlogPost)
