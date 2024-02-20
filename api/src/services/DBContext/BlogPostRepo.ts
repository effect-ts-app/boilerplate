import { RepositoryDefaultImpl } from "@effect-app/infra/services/RepositoryBase"
import { RepoLive } from "api/migrate"
import { Effect, Layer } from "effect"
import { NonEmptyString255, NonEmptyString2k } from "effect-app/schema"
import { BlogPost } from "models/Blog"
import { UserRepo } from "./UserRepo"

export interface BlogPostPersistenceModel extends BlogPost.From {
  _etag: string | undefined
}

export type BlogPostSeed = "sample" | ""

export class BlogPostRepo extends RepositoryDefaultImpl<BlogPostRepo>()<BlogPostPersistenceModel>()(
  "BlogPost",
  BlogPost
) {
  static readonly Live = Effect
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
        .pipe(Layer.effect(BlogPostRepo))
    })
    .pipe(Layer.unwrapEffect, Layer.provide(Layer.mergeAll(RepoLive, UserRepo.Live, UserRepo.UserFromIdLayer)))
}
