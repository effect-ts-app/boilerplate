import { UserRepo } from "@/services.js"
import { MeRsc } from "@effect-app-boilerplate/resources"

const { controllers, matchWithServices } = matchFor(MeRsc)

const Get = matchWithServices("Get")(
  { UserRepo },
  (_req, { UserRepo }) => UserRepo.getCurrentUser
)

export const MeControllers = controllers(Effect.struct({ Get }))
