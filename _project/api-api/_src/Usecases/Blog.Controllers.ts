import { BlogPostRepo } from "@/services.js"
import { BlogPost } from "@effect-app-boilerplate/models/Blog"
import { BlogRsc } from "@effect-app-boilerplate/resources"
import { matchResource } from "@effect-app/infra/api/routing"

export const BlogControllers = Effect.servicesWith(
  { BlogPostRepo },
  ({ BlogPostRepo }) =>
    matchResource(BlogRsc)({
      FindPost: req =>
        BlogPostRepo.find(req.id)
          .map(_ => _.getOrNull),

      GetPosts: () => BlogPostRepo.all.map(items => ({ items })),

      CreatePost: req =>
        Effect(new BlogPost({ ...req }))
          .tap(BlogPostRepo.save)
          .map(_ => _.id)
    })
)
