import { matchFor } from "api/lib/matchFor"
import { UserRepo } from "api/services"
import { MeRsc } from "resources"

const me = matchFor(MeRsc)

export default me.controllers({
  Get: me.Get(UserRepo.getCurrentUser)
})
