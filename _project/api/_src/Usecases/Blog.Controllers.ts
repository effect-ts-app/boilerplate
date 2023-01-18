import { BlogPost } from "@effect-app-boilerplate/models/Blog"
import { BlogRsc } from "@effect-app-boilerplate/resources"

const items: BlogPost[] = []

const blog = matchFor(BlogRsc)

const GetPosts = blog.GetPosts({}, () => Effect.sync(() => ({ items })))

const CreatePost = blog.CreatePost({}, (req) =>
  Effect
    .sync(() => (new BlogPost({ ...req })))
    .tap((post) => Effect.sync(() => (items.push(post))))
    .map((_) => _.id))

export default blog.controllers({ GetPosts, CreatePost })
