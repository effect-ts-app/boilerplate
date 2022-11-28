import { UserRepository } from "@/services.js"
import { MeRsc } from "@effect-ts-app/boilerplate-demo-client"

export const MeControllers = Effect.servicesWith(
  { UserRepository },
  ({ UserRepository }) =>
    matchResource(MeRsc)({
      Get: () => UserRepository.getCurrentUser
    })
)
