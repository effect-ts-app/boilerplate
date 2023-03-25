import { User } from "@effect-app-boilerplate/models/User"
import { HelloWorldRsc } from "@effect-app-boilerplate/resources"
import { UserRepo } from "api/services.js"

const { controllers, matchWithServices } = matchFor(HelloWorldRsc)

const Get = matchWithServices("Get")(
  { UserRepo },
  (_req, { context, userRepo }) =>
    userRepo.getCurrentUser
      .catchTags({ "NotLoggedInError": () => Effect(null), "NotFoundError": () => Effect(null) })
      .map(user => ({
        context,
        now: new Date(),
        currentUser: user,
        randomUser: User.Arbitrary.generate.value
      }))
)

export const HelloWorldControllers = controllers({ Get })
