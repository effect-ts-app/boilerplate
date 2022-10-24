import { RequestContext } from "@/lib/RequestContext.js"
import { HelloWorld } from "@effect-ts-app/boilerplate-client/HelloWorld"
import { User } from "@effect-ts-app/boilerplate-types/User"

export const HelloWorldControllers = Effect(
  matchResource(HelloWorld)({
    Get: () =>
      RequestContext.Tag.with(rc => ({
        context: rc,
        now: new Date(),
        user: User.Arbitrary.generate.value
      }))
  }
  )
)
