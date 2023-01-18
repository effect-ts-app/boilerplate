import { BlogPostRepo } from "@/services.js"
import { BlogPost } from "@effect-app-boilerplate/models/Blog"
import { BlogRsc } from "@effect-app-boilerplate/resources"

const { controllers, matchWithServices } = matchFor(BlogRsc)

const FindPost = matchWithServices("FindPost")(
  { BlogPostRepo },
  (req, { BlogPostRepo }) =>
    BlogPostRepo.find(req.id)
      .map(_ => _.getOrNull)
)

const GetPosts = matchWithServices("GetPosts")(
  { BlogPostRepo },
  (_, { BlogPostRepo }) => BlogPostRepo.all.map(items => ({ items }))
)

const CreatePost = matchWithServices("CreatePost")(
  { BlogPostRepo },
  (req, { BlogPostRepo }) =>
    Effect(new BlogPost({ ...req }))
      .tap(BlogPostRepo.save)
      .map(_ => _.id)
)

export const BlogControllers = controllers(Effect.struct({ FindPost, GetPosts, CreatePost }))
