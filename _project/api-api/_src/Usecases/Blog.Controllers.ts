import { BlogPost } from "@effect-app-boilerplate/models/Blog"
import { BlogRsc } from "@effect-app-boilerplate/resources"

const items: BlogPost[] = []

const { controllers, matchWith } = matchFor(BlogRsc)

const GetPosts = matchWith("GetPosts")(
  () => Effect({ items })
)

const CreatePost = matchWith("CreatePost")(
  req =>
    Effect(new BlogPost({ ...req }))
      .tap(post => Effect(items.push(post)))
      .map(_ => _.id)
)

export const BlogControllers = controllers(Effect.struct({ GetPosts, CreatePost }))
