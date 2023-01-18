import type { BlogPost } from "@effect-app-boilerplate/models/Blog"
import { RepoLive } from "api/migrate.js"

export interface BlogPostRepo {
  all: Effect<never, never, readonly BlogPost[]>
  save: (post: BlogPost) => Effect<never, never, void>
}
export const BlogPostRepo = Tag<BlogPostRepo>()

export const BlogPostRepoLive = Layer
  .sync(BlogPostRepo, () => {
    const items: BlogPost[] = []

    return {
      all: Effect.sync(() => [...items]),
      save: (post) => Effect.sync(() => (items.push(post)))
    }
  })
  .provide(RepoLive)
