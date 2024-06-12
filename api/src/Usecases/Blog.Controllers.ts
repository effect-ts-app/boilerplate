import { matchFor } from "api/lib/matchFor.js"
import { BlogPostRepo, Events, forkOperationWithEffect, Operations, UserRepo } from "api/services.js"
import { Duration, Effect, Schedule } from "effect"
import { Option } from "effect-app"
import { NonEmptyString2k, NonNegativeInt } from "effect-app/schema"
import { BlogPost } from "models/Blog.js"
import { BlogRsc } from "resources.js"
import { BogusEvent } from "resources/Events.js"

const blog = matchFor(BlogRsc)

export default blog.controllers({
  FindPost: blog.FindPost((req) =>
    BlogPostRepo
      .find(req.id)
      .pipe(Effect.andThen(Option.getOrNull))
  ),

  GetPosts: blog.GetPosts(
    BlogPostRepo
      .all
      .pipe(Effect.andThen((items) => ({ items })))
  ),

  CreatePost: blog.CreatePost((req) =>
    UserRepo
      .getCurrentUser
      .pipe(
        Effect.andThen((author) => (new BlogPost({ ...req, author }, true))),
        Effect.tap(BlogPostRepo.save)
      )
  ),

  PublishPost: blog.PublishPost((req) =>
    Effect.gen(function*() {
      const post = yield* BlogPostRepo.get(req.id)

      console.log("publishing post", post)

      const targets = [
        "google",
        "twitter",
        "facebook"
      ]

      const done: string[] = []

      const operationId = yield* forkOperationWithEffect(
        (opId) =>
          Operations
            .update(opId, {
              total: NonNegativeInt(targets.length),
              completed: NonNegativeInt(done.length)
            })
            .pipe(
              Effect.andThen(Effect.forEach(targets, (_) =>
                Effect
                  .sync(() => done.push(_))
                  .pipe(
                    Effect.tap(() =>
                      Operations.update(opId, {
                        total: NonNegativeInt(targets.length),
                        completed: NonNegativeInt(done.length)
                      })
                    ),
                    Effect.delay(Duration.seconds(4))
                  ))),
              Effect.andThen(() => "the answer to the universe is 41")
            ),
        // while operation is running...
        (_opId) =>
          Effect
            .suspend(() => Events.publish(new BogusEvent()))
            .pipe(Effect.schedule(Schedule.spaced(Duration.seconds(1)))),
        NonEmptyString2k("post publishing")
      )

      return operationId
    })
  )
})
