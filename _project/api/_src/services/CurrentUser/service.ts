import type { User } from "@effect-app-boilerplate/models/User"
import type { NotLoggedInError } from "@effect-app/infra/errors"

export const CurrentUserId = Symbol("CurrentUser")
/**
 * @tsplus type CurrentUser
 * @tsplus companion CurrentUser.Ops
 */
export abstract class CurrentUser extends TagBaseTagged<Tag<CurrentUser>>()(CurrentUserId) {
  abstract get: Effect<never, NotLoggedInError, User>
}
