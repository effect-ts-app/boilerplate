import { matchFor } from "api/lib/routing.js"
import { UserRepo } from "api/services.js"
import { Effect } from "effect-app"
import { MeRsc } from "resources.js"

const meRouter = matchFor(MeRsc)

export default meRouter.effect(
  [UserRepo.Default],
  Effect.gen(function*() {
    return {
      GetMe: class extends meRouter.GetMe(UserRepo.getCurrentUser) {}
    }
  })
)
