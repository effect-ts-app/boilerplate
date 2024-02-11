import { BlogPost } from "@effect-app-boilerplate/models/Blog"
import { BlogRsc } from "@effect-app-boilerplate/resources"
import { BogusEvent } from "@effect-app-boilerplate/resources/Events"
import { matchFor } from "api/lib/matchFor.js"
import { BlogPostRepo, Events, forkOperationWithEffect, Operations, UserRepo } from "api/services.js"
import { Duration, Effect, Schedule } from "effect"
import { NonNegativeInt } from "effect-app/schema"

const blog = matchFor(BlogRsc)

const FindPost = blog.FindPost(
  (req) =>
    BlogPostRepo
      .find(req.id)
      .andThen((_) => _.value ?? null)
)

const GetPosts = blog.GetPosts(
  BlogPostRepo
    .all
    .andThen((items) => ({ items }))
)

const CreatePost = blog.CreatePost(
  (req) =>
    UserRepo
      .getCurrentUser
      .andThen((author) => (new BlogPost({ ...req, author }, true)))
      .tap(BlogPostRepo.save)
)

const PublishPost = blog.PublishPost(
  (req) =>
    Effect.gen(function*($) {
      const post = yield* $(BlogPostRepo.get(req.id))

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
            Operations
              .update(opId, {
                total: NonNegativeInt(targets.length),
                completed: NonNegativeInt(done.length)
              })
              .andThen(targets
                .forEachEffect((_) =>
                  Effect
                    .sync(() => done.push(_))
                    .tap(() =>
                      Operations.update(opId, {
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
              .suspend(() => Events.publish(new BogusEvent()))
              .pipe(Effect.schedule(Schedule.spaced(Duration.seconds(1))))
        )
      )

      return operationId
    })
)

export default blog.controllers({ FindPost, GetPosts, CreatePost, PublishPost })
