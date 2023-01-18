import { BlogPost, BlogPostId } from "@effect-app-boilerplate/models/Blog"

@allowRoles("user")
export class CreatePostRequest extends Req(cfg({ allowAnonymous: true }))<CreatePostRequest>()(
  BlogPost.fields.$$.pick("title", "body")
) {}

export const CreatePostResponse = BlogPostId
