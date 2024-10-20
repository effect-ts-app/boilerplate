import { RepositoryDefaultImpl2 } from "@effect-app/infra/services/RepositoryBase"
import { RepoDefault } from "api/lib/layers.js"
import { Effect } from "effect"
import { NonEmptyString255, NonEmptyString2k } from "effect-app/schema"
import { BlogPost } from "models/Blog.js"
import { UserRepo } from "./UserRepo.js"

export type BlogPostSeed = "sample" | ""

export class BlogPostRepo extends RepositoryDefaultImpl2<BlogPostRepo>()(
  "BlogPost",
  BlogPost,
  {
    dependencies: [RepoDefault, UserRepo.Default, UserRepo.UserFromIdLayer],
    options: Effect.gen(function*() {
      const seed = "sample"
      const userRepo = yield* UserRepo

      const makeInitial = yield* Effect.cached(
        seed === "sample"
          ? userRepo
            .all
            .pipe(
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
      )
      return { makeInitial }
    })
  }
) {
}
