import { S } from "@effect-app/prelude"
import { Req } from "../lib.js"
import { BlogPostView } from "../Views.js"

export class GetPostsRequest extends Req({ allowAnonymous: true, allowRoles: ["user"] })<GetPostsRequest>()({}) {}

export class GetPostsResponse extends S.Class<GetPostsResponse>()({
  items: S.array(BlogPostView)
}) {}
