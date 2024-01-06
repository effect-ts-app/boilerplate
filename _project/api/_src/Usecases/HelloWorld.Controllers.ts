import { User } from "@effect-app-boilerplate/models/User"
import { HelloWorldRsc } from "@effect-app-boilerplate/resources"
import { GetHelloWorldResponse } from "@effect-app-boilerplate/resources/HelloWorld/Get"
import { UserRepo } from "api/services.js"

const helloWorld = matchFor(HelloWorldRsc)

const Get = helloWorld.Get(
  { UserRepo },
  ({ echo }, { context, userRepo }) =>
    userRepo
      .getCurrentUser
      .catchTags({ "NotLoggedInError": () => Effect(null), "NotFoundError": () => Effect(null) })
      .map((user) =>
        new GetHelloWorldResponse({
          context,
          echo,
          now: new Date(),
          currentUser: user,
          randomUser: User.Arbitrary.generate.value
        })
      )
)

export default helloWorld.controllers({ Get })
