import { BlogPost } from "@effect-app-boilerplate/models/Blog"
import { BlogRsc } from "@effect-app-boilerplate/resources"
import { matchResource } from "@effect-app/infra/api/routing"

const items: BlogPost[] = []

export const BlogControllers = Effect(
  matchResource(BlogRsc)({
    GetPosts: () => Effect({ items }),

    CreatePost: req =>
      Effect(new BlogPost({ ...req }))
        .tap(post => Effect(items.push(post)))
        .map(_ => _.id)
  })
)
