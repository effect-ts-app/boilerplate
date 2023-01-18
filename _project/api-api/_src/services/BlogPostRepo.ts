import type { BlogPost, BlogPostId } from "@effect-app-boilerplate/models/Blog"

export interface BlogPostRepo {
  all: Effect<never, never, readonly BlogPost[]>
  find: (id: BlogPostId) => Effect<never, never, Opt<BlogPost>>
  save: (post: BlogPost) => Effect<never, never, void>
}
export const BlogPostRepo = Tag<BlogPostRepo>()

export const BlogPostRepoLive = Layer(BlogPostRepo, () => {
  const items: BlogPost[] = []

  return {
    all: Effect([...items]),
    find: id => Effect(items.findFirst(_ => _.id === id)),
    save: post => Effect(items.push(post))
  }
})
