import { CurrentUser } from "@/services.js"
import { HelloWorldRsc } from "@effect-ts-app/boilerplate-client"
import { RequestContext } from "@effect-ts-app/boilerplate-infra/lib/RequestContext"
import { User } from "@effect-ts-app/boilerplate-types/User"

export const HelloWorldControllers = Effect(
  matchResource(HelloWorldRsc)({
    Get: () =>
      Do($ => {
        const currentUser = $(CurrentUser.find.map(_ => _.toNullable))
        const context = $(Effect.service(RequestContext.Tag))
        return {
          context,
          now: new Date(),
          currentUser,
          randomUser: User.Arbitrary.generate.value
        }
      })
  })
)
