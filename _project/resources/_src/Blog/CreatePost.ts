import { BlogPost, BlogPostId } from "@effect-app-boilerplate/models/Blog"

export class CreatePostRequest extends Req()<CreatePostRequest>()(
  BlogPost.fields.$$.pick("title", "body")
) {}

export const CreatePostResponse = BlogPostId
