import { array, Class } from "@effect-app/prelude/schema"
import { Req } from "../lib.js"
import { BlogPostView } from "../Views.js"

export class GetPostsRequest extends Req({ allowAnonymous: true, allowRoles: ["user"] })<GetPostsRequest>()(
  {}
) {}

export class GetPostsResponse extends Class<GetPostsResponse>()({
  items: array(BlogPostView)
}) {}
