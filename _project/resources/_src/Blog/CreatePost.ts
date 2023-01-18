import { BlogPost, BlogPostId } from "@effect-app-boilerplate/models/Blog"

@allowAnonymous
@allowRoles("user")
export class CreatePostRequest extends Post("/blog/posts")<CreatePostRequest>()(
  BlogPost.pick("title", "body")
) {}

export const CreatePostResponse = BlogPostId
