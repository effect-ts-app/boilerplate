import { UserRepository } from "@/services.js"
import { MeRsc } from "@effect-ts-app/client"

export const MeControllers = Effect.servicesWith(
  { UserRepository },
  ({ UserRepository }) =>
    matchResource(MeRsc)({
      Get: () => UserRepository.getCurrentUser
    })
)
