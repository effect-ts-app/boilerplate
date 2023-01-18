import { BlogPost } from "@effect-app-boilerplate/models/Blog"
import { BlogRsc } from "@effect-app-boilerplate/resources"
import { BlogPostRepo } from "api/services.js"

const blog = matchFor(BlogRsc)
const GetPosts = blog.GetPosts(
  { BlogPostRepo },
  (_, { blogPostRepo }) => blogPostRepo.all.map((items) => ({ items }))
)

const CreatePost = blog.CreatePost(
  { BlogPostRepo },
  (req, { blogPostRepo }) =>
    Effect
      .sync(() => (new BlogPost({ ...req })))
      .tap(blogPostRepo.save)
      .map((_) => _.id)
)

export default blog.controllers({ GetPosts, CreatePost })
