import { UserRepo } from "@/services.js"
import { MeRsc } from "@effect-app-boilerplate/resources"

export const MeControllers = Effect.servicesWith(
  { UserRepo },
  ({ UserRepo }) =>
    matchResource(MeRsc)({
      Get: () => UserRepo.getCurrentUser
    })
)
