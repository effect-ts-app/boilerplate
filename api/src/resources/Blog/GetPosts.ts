import { S } from "resources/lib"
import { BlogPostView } from "../Views"

export class GetPostsRequest extends S.Req({ allowAnonymous: true, allowRoles: ["user"] })<GetPostsRequest>()({}) {}

export class GetPostsResponse extends S.Class<GetPostsResponse>()({
  items: S.array(BlogPostView)
}) {}
