import { S } from "resources/lib.js"
import { BlogPostView } from "../../resources/Views.js"

export class GetPostsRequest extends S.Req({ allowAnonymous: true, allowRoles: ["user"] })<GetPostsRequest>()({}) {}

export class GetPostsResponse extends S.Class<GetPostsResponse>()({
  items: S.array(BlogPostView)
}) {}
