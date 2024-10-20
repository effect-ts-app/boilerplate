import { matchFor } from "api/lib/routing.js"
import { UserRepo } from "api/services.js"
import { Effect } from "effect-app"
import { MeRsc } from "resources.js"

export default matchFor(MeRsc)([
  UserRepo.Default
], ({ GetMe }) =>
  Effect.gen(function*() {
    return {
      GetMe: GetMe(UserRepo.getCurrentUser)
    }
  }))
