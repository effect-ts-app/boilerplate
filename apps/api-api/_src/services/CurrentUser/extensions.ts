// /** @tsplus fluent CurrentUser.Ops Live */
// export function LiveCurrentUser(user: User) {
//   return Layer.succeed(CurrentUser)(user)
// }

import type { User } from "@effect-ts-app/boilerplate-types/User"
import type { CurrentUserOps } from "../CurrentUser.js"
import { CurrentUser } from "../CurrentUser.js"

/**
 * @tsplus static CurrentUser.Ops get
 */
export const GetCurrentUser = Effect.serviceWithEffect(CurrentUser)(_ => _.get)

/**
 * @tsplus getter CurrentUser.Ops with
 */
export function with_(self: CurrentUserOps) {
  return <B>(f: (x: User) => B) => Effect.serviceWithEffect(self)(_ => _.get.map(f))
}

/**
 * @tsplus getter CurrentUser.Ops withEffect
 */
export function withEffect_(self: CurrentUserOps) {
  return <R, E, B>(f: (x: User) => Effect<R, E, B>) => Effect.serviceWithEffect(self)(_ => _.get.flatMap(f))
}

/**
 * @tsplus getter CurrentUser.Ops get
 */
export function get(self: CurrentUserOps) {
  return self.accessWithEffect(_ => _.get)
}

/** @tsplus static CurrentUser.Ops find */
export const FindCurrentUser = CurrentUser.accessWithEffect(
  _ => _.get.map(Opt.some).catchTag("NotLoggedInError", () => Effect.succeed(Opt.none))
)
