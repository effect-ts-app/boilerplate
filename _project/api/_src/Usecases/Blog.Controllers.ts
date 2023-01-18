import { BlogPost } from "@effect-app-boilerplate/models/Blog"
import { BlogRsc } from "@effect-app-boilerplate/resources"
import { NotFoundError } from "api/errors.js"
import { BlogPostRepo, Operations } from "api/services.js"

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
  { BlogPostRepo },
  (req, { blogPostRepo }) =>
    Effect
      .sync(() => (new BlogPost({ ...req })))
      .tap(blogPostRepo.save)
      .map((_) => _.id)
)

const PublishPost = blog.PublishPost(
  { BlogPostRepo, Operations },
  (req, { blogPostRepo, operations }) =>
    Do(($) => {
      $(
        blogPostRepo
          .find(req.id)
          .flatMap((_) => _.encaseInEffect(() => new NotFoundError({ type: "BlogPost", id: req.id })))
      )

      const targets = [
        "google",
        "twitter",
        "facebook"
      ]

      const done: string[] = []

      const operationId = $(
        Effect.forkOperation(
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
              .map(() => "the answer to the universe is 41")
        )
      )

      return operationId
    })
)

export default blog.controllers({ FindPost, GetPosts, CreatePost, PublishPost })
