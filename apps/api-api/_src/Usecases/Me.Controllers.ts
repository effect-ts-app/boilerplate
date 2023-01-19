import { UserRepository } from "@/services.js"
import { MeRsc } from "@effect-app-boilerplate/client"

export const MeControllers = Effect.servicesWith(
  { UserRepository },
  ({ UserRepository }) =>
    matchResource(MeRsc)({
      Get: () => UserRepository.getCurrentUser
    })
)
