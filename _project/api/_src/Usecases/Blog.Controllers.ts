import { BlogPost } from "@effect-app-boilerplate/models/Blog"
import { BlogRsc } from "@effect-app-boilerplate/resources"
import { BogusEvent } from "@effect-app-boilerplate/resources/Events"
import { BlogPostRepo, Events, Operations, UserRepo } from "api/services.js"

const blog = matchFor(BlogRsc)

const FindPost = blog.FindPost(
  { BlogPostRepo },
  (req, { blogPostRepo }) =>
    blogPostRepo
      .find(req.id)
      .map((_) => _.getOrNull)
)

const GetPosts = blog.GetPosts(
  { BlogPostRepo },
  (_, { blogPostRepo }) => blogPostRepo.all.map((items) => ({ items }))
)

const CreatePost = blog.CreatePost(
  { BlogPostRepo, UserRepo },
  (req, { blogPostRepo, userRepo }) =>
    userRepo
      .getCurrentUser
      .map((user) => (new BlogPost({ ...req, user }, true)))
      .tap(blogPostRepo.save)
)

const PublishPost = blog.PublishPost(
  { BlogPostRepo, Events, Operations },
  (req, { blogPostRepo, events, operations }) =>
    Do(($) => {
      const post = $(blogPostRepo.get(req.id))

      console.log("publishing post", post)

      const targets = [
        "google",
        "twitter",
        "facebook"
      ]

      const done: string[] = []

      const operationId = $(
        Effect.forkOperationWithEffect(
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
                    .delay(Duration.seconds(4))
                ))
              .map(() => "the answer to the universe is 41"),
          // while operation is running...
          (_opId) =>
            Effect
              .suspend(() => events.publish(new BogusEvent()))
              .schedule(Schedule.spaced(Duration.seconds(1)))
        )
      )

      return operationId
    })
)

export default blog.controllers({ FindPost, GetPosts, CreatePost, PublishPost })
