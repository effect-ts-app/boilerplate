import type { User } from "@effect-app-boilerplate/models/User"
import { CurrentUser } from "./service.js"

/**
 * @tsplus static CurrentUser.Ops get
 */
export const GetCurrentUser = CurrentUser.flatMap(_ => _.get)

/**
 * @tsplus static CurrentUser.Ops with
 */
export const with_ = <B>(f: (x: User) => B) => CurrentUser.flatMap(_ => _.get.map(f))

/**
 * @tsplus static CurrentUser.Ops withEffect
 */
export const withEffect = <R, E, B>(f: (x: User) => Effect<R, E, B>) => CurrentUser.flatMap(_ => _.get.flatMap(f))

/** @tsplus static CurrentUser.Ops find */
export const FindCurrentUser = CurrentUser.flatMap(
  _ => _.get.map(Option.some).catchTag("NotLoggedInError", () => Effect(Option.none))
)
