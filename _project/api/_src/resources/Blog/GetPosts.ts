import { S } from "@effect-app-boilerplate/resources/lib"
import { BlogPostView } from "../Views.js"

export class GetPostsRequest extends S.Req({ allowAnonymous: true, allowRoles: ["user"] })<GetPostsRequest>()({}) {}

export class GetPostsResponse extends S.Class<GetPostsResponse>()({
  items: S.array(BlogPostView)
}) {}
