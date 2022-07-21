import { RequestContext } from "@/RequestContext.js"
import { generateFromArbitrary } from "@/test.arbs.js"
import { HelloWorld } from "@effect-ts-app/boilerplate-client/HelloWorld"
import { User } from "@effect-ts-app/boilerplate-types/User"

export const GetHelloWorld = handle(HelloWorld.Get)(
  () =>
    RequestContext.Tag.access(rc => ({
      context: rc,
      now: new Date(),
      user: generateFromArbitrary(User.Arbitrary).value
    }))
)
