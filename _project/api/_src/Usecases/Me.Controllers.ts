import { MeRsc } from "@effect-app-boilerplate/resources"
import { matchFor } from "api/lib/matchFor.js"
import { UserRepo } from "api/services.js"

const me = matchFor(MeRsc)

export default me.controllers({
  Get: me.Get(UserRepo.getCurrentUser)
})
