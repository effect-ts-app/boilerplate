import { BlogPost } from "@effect-app-boilerplate/models/Blog"
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
        .andThen((userRepo) => userRepo.all)
        .andThen((users) =>
          users
            .flatMap((_) => [_, _])
            .map((user, i) =>
              new BlogPost({
                title: NonEmptyString255("Test post " + i),
                body: NonEmptyString2k("imma test body"),
                author: user
              }, true)
            )
        )
      : Effect.succeed([])
    return BlogPostRepo
      .makeWith({ makeInitial }, (_) => new BlogPostRepo(_))
      .toLayer(BlogPostRepo)
  })
  .unwrapLayer
  .provide(Layer.mergeAll(RepoLive, UserRepo.Live, UserRepo.UserFromIdLayer))
