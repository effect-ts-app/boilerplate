import { NotFoundError } from "@/errors.js"
import { BlogPostRepo, Operations } from "@/services.js"
import { BlogPost } from "@effect-app-boilerplate/models/Blog"
import { BlogRsc } from "@effect-app-boilerplate/resources"
import { PositiveInt } from "@effect-app/prelude/schema"

const { controllers, matchWithServices } = matchFor(BlogRsc)

const FindPost = matchWithServices("FindPost")(
  { BlogPostRepo },
  (req, { BlogPostRepo }) =>
    BlogPostRepo.find(req.id)
      .map(_ => _.getOrNull)
)

const GetPosts = matchWithServices("GetPosts")(
  { BlogPostRepo },
  (_, { BlogPostRepo }) => BlogPostRepo.all.map(items => ({ items }))
)

const CreatePost = matchWithServices("CreatePost")(
  { BlogPostRepo },
  (req, { BlogPostRepo }) =>
    Effect(new BlogPost({ ...req }))
      .tap(BlogPostRepo.save)
      .map(_ => _.id)
)

const PublishPost = matchWithServices("PublishPost")(
  { BlogPostRepo, Operations },
  (req, { BlogPostRepo, Operations }) =>
    Do($ => {
      $(
        BlogPostRepo.find(req.id)
          .flatMap(_ => _.encaseInEffect(() => new NotFoundError("BlogPost", req.id)))
      )

      const targets = [
        "google",
        "twitter",
        "facebook"
      ]

      const done: string[] = []

      const operationId = $(
        Effect.forkOperation(
          opId =>
            Operations.update(opId, {
              total: PositiveInt(targets.length),
              completed: PositiveInt(done.length)
            }) >
              targets
                .forEachEffect(_ =>
                  Effect(done.push(_))
                    .tap(() =>
                      Operations.update(opId, {
                        total: PositiveInt(targets.length),
                        completed: PositiveInt(done.length)
                      })
                    )
                    .delay(Duration.seconds(4))
                )
                .map(() => "the answer to the universe is 41")
        )
      )

      return operationId
    })
)

export const BlogControllers = controllers(Effect.struct({ FindPost, GetPosts, CreatePost, PublishPost }))
