import type { User } from "@effect-app-boilerplate/models/User"
import { CurrentUser } from "../CurrentUser.js"

/**
 * @tsplus static CurrentUser.Ops get
 */
export const GetCurrentUser = Effect.serviceWithEffect(CurrentUser, _ => _.get)

/**
 * @tsplus static CurrentUser.Ops with
 */
export const with_ = <B>(f: (x: User) => B) => Effect.serviceWithEffect(CurrentUser, _ => _.get.map(f))

/**
 * @tsplus static CurrentUser.Ops withEffect
 */
export const withEffect = <R, E, B>(f: (x: User) => Effect<R, E, B>) =>
  Effect.serviceWithEffect(CurrentUser, _ => _.get.flatMap(f))

/** @tsplus static CurrentUser.Ops find */
export const FindCurrentUser = CurrentUser.accessWithEffect(
  _ => _.get.map(Option.some).catchTag("NotLoggedInError", () => Effect(Option.none))
)
