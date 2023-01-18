import { BlogPost } from "@effect-app-boilerplate/models/Blog"

@allowRoles("user")
export class GetPostsRequest extends Req(cfg({ allowAnonymous: true }))<GetPostsRequest>()(
  {}
) {}

export class GetPostsResponse extends Class<GetPostsResponse>()({
  items: array(BlogPost)
}) {}
