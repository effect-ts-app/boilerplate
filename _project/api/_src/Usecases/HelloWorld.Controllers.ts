import { User } from "@effect-app-boilerplate/models/User"
import { HelloWorldRsc } from "@effect-app-boilerplate/resources"
import { UserRepo } from "api/services.js"

const helloWorld = matchFor(HelloWorldRsc)

const Get = helloWorld.matchGet(
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

export default helloWorld.controllers({ Get })
