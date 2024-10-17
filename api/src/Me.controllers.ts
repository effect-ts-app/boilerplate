import { matchFor } from "api/lib/routing.js"
import { UserRepo } from "api/services.js"
import { Effect } from "effect-app"
import { MeRsc } from "resources.js"

const router = matchFor(MeRsc)

export default router.effect(
  [UserRepo.Default],
  Effect.gen(function*() {
    return {
      GetMe: class extends router.GetMe(UserRepo.getCurrentUser) {}
    }
  })
)
