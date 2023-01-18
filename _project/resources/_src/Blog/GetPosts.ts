import { BlogPost } from "@effect-app-boilerplate/models/Blog"

export class GetPostsRequest extends Req()<GetPostsRequest>()(
  {}
) {}

export class GetPostsResponse extends Class<GetPostsResponse>()({
  items: array(BlogPost)
}) {}
