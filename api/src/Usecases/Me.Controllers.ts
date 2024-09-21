import { matchFor } from "api/lib/matchFor.js"
import { UserRepo } from "api/services.js"
import { MeRsc } from "resources.js"

const me = matchFor(MeRsc)

export default me.controllers({
  GetMe: me.GetMe(UserRepo.getCurrentUser)
})
