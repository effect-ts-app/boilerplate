import { BlogPost, BlogPostId } from "@effect-app-boilerplate/models/Blog"
import { RepositoryDefaultImpl } from "@effect-app/infra/services/RepositoryBase"
import { RepoLive } from "api/migrate.js"
import { UserRepo } from "./UserRepo.js"

export interface BlogPostPersistenceModel extends BlogPost.From {
  _etag: string | undefined
}

export type BlogPostSeed = "sample" | ""

/**
 * @tsplus type BlogPostRepo
 * @tsplus companion BlogPostRepo.Ops
 */
export class BlogPostRepo extends RepositoryDefaultImpl<BlogPostRepo>()<BlogPostPersistenceModel>()(
  "BlogPost",
  BlogPost
) {}

/**
 * @tsplus static BlogPostRepo.Ops Live
 */
export const LiveBlogPostRepo = Effect
  .sync(() => {
    const seed = "sample"
    const makeInitial = seed === "sample"
      ? UserRepo
        .andThen((userRepo) => userRepo.all.map((_) => _[0]!))
        .andThen((user) => [
          new BlogPost({
            id: BlogPostId("post-test123"),
            title: NonEmptyString255("Test post"),
            body: NonEmptyString2k("imma test body"),
            user
          }, true)
        ])
      : Effect.succeed([])
    return BlogPostRepo
      .makeWith({ makeInitial }, (_) => new BlogPostRepo(_))
      .toLayer(BlogPostRepo)
  })
  .unwrapLayer
  .provide(Layer.mergeAll(RepoLive, UserRepo.Live, UserRepo.UserFromIdLayer))
