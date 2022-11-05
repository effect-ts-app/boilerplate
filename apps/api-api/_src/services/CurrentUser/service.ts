import type { User } from "@effect-ts-app/boilerplate-types/User"
import type { NotLoggedInError } from "@effect-ts-app/infra/errors"

/**
 * @tsplus type CurrentUser
 */
export interface CurrentUser {
  get: Effect<never, NotLoggedInError, User>
}

export const CurrentUser: CurrentUserOps = Tag<CurrentUser>()

/**
 * @tsplus type CurrentUser.Ops
 */
export interface CurrentUserOps extends Tag<CurrentUser> {}
