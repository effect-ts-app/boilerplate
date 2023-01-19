import { NotFoundError } from "@/errors.js"
import { BlogPostRepo, Events, Operations } from "@/services.js"
import { BlogPost } from "@effect-app-boilerplate/models/Blog"
import { BlogRsc } from "@effect-app-boilerplate/resources"
import { BogusEvent } from "@effect-app-boilerplate/resources/Events"
import { matchResource } from "@effect-app/infra/api/routing"
import { PositiveInt } from "@effect-app/prelude/schema"

export const BlogControllers = Effect.servicesWith(
  { BlogPostRepo, Operations, Events },
  ({ BlogPostRepo, Events, Operations }) =>
    matchResource(BlogRsc)({
      FindPost: req =>
        BlogPostRepo.find(req.id)
          .map(_ => _.getOrNull),

      GetPosts: () => BlogPostRepo.all.map(items => ({ items })),

      CreatePost: req =>
        Effect(new BlogPost({ ...req }))
          .tap(BlogPostRepo.save)
          .map(_ => _.id),

      PublishPost: req =>
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
            Effect.forkOperationWithEffect(
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
                        .delay(DUR.seconds(4))
                    )
                    .map(() => "the answer to the universe is 41"),
              // while operation is running...
              _opId =>
                Effect.suspendSucceed(() => Events.publish(new BogusEvent({})))
                  .delay(DUR.seconds(1))
                  .forever
            )
          )

          return operationId
        })
    })
)
