import { BlogPostView } from "../Views.js"

@allowRoles("user")
export class GetPostsRequest extends Req(cfg({ allowAnonymous: true }))<GetPostsRequest>()(
  {}
) {}

export class GetPostsResponse extends Class<GetPostsResponse>()({
  items: array(BlogPostView)
}) {}
