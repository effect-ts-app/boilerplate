import { matchFor } from "api/lib/routing.js"
import { UserRepo } from "api/services.js"
import { MeRsc } from "resources.js"

const me = matchFor(MeRsc)

export default me.controllers({
  GetMe: class extends me.GetMe(UserRepo.getCurrentUser) {}
})
