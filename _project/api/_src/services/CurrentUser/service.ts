import type { User } from "@effect-app-boilerplate/models/User"
import type { NotLoggedInError } from "@effect-app/infra/errors"

export const CurrentUserId = Symbol()

/**
 * @tsplus type CurrentUser
 */
export interface CurrentUser extends ServiceTagged<typeof CurrentUserId> {
  get: Effect<never, NotLoggedInError, User>
}

export const CurrentUser: CurrentUserOps = Tag<CurrentUser>()

/**
 * @tsplus type CurrentUser.Ops
 */
export interface CurrentUserOps extends Tag<CurrentUser> {}
