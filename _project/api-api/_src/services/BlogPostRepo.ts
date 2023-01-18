import type { BlogPost } from "@effect-ts-app/boilerplate-types/Blog"

export interface BlogPostRepo {
  all: Effect<never, never, readonly BlogPost[]>
  save: (post: BlogPost) => Effect<never, never, void>
}
export const BlogPostRepo = Tag<BlogPostRepo>()

export const BlogPostRepoLive = Layer(BlogPostRepo, () => {
  const items: BlogPost[] = []

  return {
    all: Effect([...items]),
    save: post => Effect(items.push(post))
  }
})
