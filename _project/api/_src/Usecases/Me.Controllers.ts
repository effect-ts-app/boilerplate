import { MeRsc } from "@effect-app-boilerplate/resources"
import { matchFor } from "api/lib/routing.js"
import { UserRepo } from "api/services.js"

const me = matchFor(MeRsc)

const Get = me.matchGet(
  { UserRepo },
  (_req, { userRepo }) => userRepo.getCurrentUser
)

export default me.controllers({ Get })
