import { MeRsc } from "@effect-app-boilerplate/resources"
import { matchFor } from "api/lib/routing.js"
import { UserRepo } from "api/services.js"

const { controllers, matchWithServices } = matchFor(MeRsc)

const Get = matchWithServices("Get")(
  { UserRepo },
  (_req, { userRepo }) => userRepo.getCurrentUser
)

export const MeControllers = controllers({ Get })
