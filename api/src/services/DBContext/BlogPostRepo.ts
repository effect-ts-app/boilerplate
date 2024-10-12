import { RepositoryDefaultImpl } from "@effect-app/infra/services/RepositoryBase"
import { RepoLive } from "api/lib/layers.js"
import { Effect, Layer } from "effect"
import { NonEmptyString255, NonEmptyString2k } from "effect-app/schema"
import { BlogPost } from "models/Blog.js"
import { UserRepo } from "./UserRepo.js"

export type BlogPostSeed = "sample" | ""

export class BlogPostRepo extends RepositoryDefaultImpl<BlogPostRepo>()(
  "BlogPost",
  BlogPost
) {
  static readonly Default = Effect
    .sync(() => {
      const seed = "sample"
      const makeInitial = seed === "sample"
        ? UserRepo
          .pipe(
            Effect.andThen((userRepo) => userRepo.all),
            Effect.andThen((users) =>
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
          )
        : Effect.succeed([])
      return BlogPostRepo
        .makeWith({ makeInitial }, (_) => new BlogPostRepo(_))
        .pipe(Layer.effect(BlogPostRepo))
    })
    .pipe(
      Layer.unwrapEffect,
      Layer.provide(Layer.mergeAll(
        RepoLive,
        UserRepo.Default,
        UserRepo.UserFromIdLayer
      ))
    )
}
