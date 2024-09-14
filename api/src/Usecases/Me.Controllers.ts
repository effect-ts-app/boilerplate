import { matchFor } from "api/lib/matchFor.js"
import { UserRepo } from "api/services.js"
import { MeRsc } from "resources.js"

const me = matchFor(MeRsc)

class Get extends me.Get(UserRepo.getCurrentUser) {}

export default me.controllers({
  Get
})
