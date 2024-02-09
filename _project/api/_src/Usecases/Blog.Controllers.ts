import { BlogPost } from "@effect-app-boilerplate/models/Blog"
import { BlogRsc } from "@effect-app-boilerplate/resources"
import { BogusEvent } from "@effect-app-boilerplate/resources/Events"
import { get, save } from "@effect-app/infra/services/Repository"
import { NonNegativeInt } from "@effect-app/prelude/schema"
import { matchFor } from "api/lib/matchFor.js"
import { BlogPostRepo, Events, forkOperationWithEffect, Operations, UserRepo } from "api/services.js"
import { Duration, Effect, Schedule } from "effect"

const blog = matchFor(BlogRsc)

const FindPost = blog.FindPost(
  { BlogPostRepo },
  (req, { blogPostRepo }) =>
    blogPostRepo
      .find(req.id)
      .andThen((_) => _.value ?? null)
)

const GetPosts = blog.GetPosts(
  { BlogPostRepo },
  (_, { blogPostRepo }) => blogPostRepo.all.andThen((items) => ({ items }))
)

const CreatePost = blog.CreatePost(
  { BlogPostRepo, UserRepo },
  (req, { blogPostRepo, userRepo }) =>
    userRepo
      .getCurrentUser
      .andThen((author) => (new BlogPost({ ...req, author }, true)))
      .tap(save(blogPostRepo))
)

const PublishPost = blog.PublishPost(
  { BlogPostRepo, Events, Operations },
  (req, { blogPostRepo, events, operations }) =>
    Effect.gen(function*($) {
      const post = yield* $(get(blogPostRepo, req.id))

      console.log("publishing post", post)

      const targets = [
        "google",
        "twitter",
        "facebook"
      ]

      const done: string[] = []

      const operationId = yield* $(
        forkOperationWithEffect(
          (opId) =>
            operations
              .update(opId, {
                total: NonNegativeInt(targets.length),
                completed: NonNegativeInt(done.length)
              })
              .andThen(targets
                .forEachEffect((_) =>
                  Effect
                    .sync(() => done.push(_))
                    .tap(() =>
                      operations.update(opId, {
                        total: NonNegativeInt(targets.length),
                        completed: NonNegativeInt(done.length)
                      })
                    )
                    .pipe(Effect.delay(Duration.seconds(4)))
                ))
              .andThen(() => "the answer to the universe is 41"),
          // while operation is running...
          (_opId) =>
            Effect
              .suspend(() => events.publish(new BogusEvent()))
              .pipe(Effect.schedule(Schedule.spaced(Duration.seconds(1))))
        )
      )

      return operationId
    })
)

export default blog.controllers({ FindPost, GetPosts, CreatePost, PublishPost })
