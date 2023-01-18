import { BlogPost, BlogPostId } from "@effect-app-boilerplate/models/Blog"

export interface BlogPostRepo {
  all: Effect<never, never, readonly BlogPost[]>
  find: (id: BlogPostId) => Effect<never, never, Option<BlogPost>>
  save: (post: BlogPost) => Effect<never, never, void>
}
export const BlogPostRepo = Tag<BlogPostRepo>()

export const BlogPostRepoLive = Layer
  .sync(BlogPostRepo, () => {
    const items: BlogPost[] = [
      new BlogPost({
        id: BlogPostId("post-test123"),
        title: NonEmptyString255("Test post"),
        body: NonEmptyString2k("imma test body")
      })
    ]

    return {
      all: Effect.sync(() => [...items]),
      find: (id) => Effect.sync(() => items.findFirst((_) => _.id === id)),
      save: (post) => Effect.sync(() => items.push(post))
    }
  })
