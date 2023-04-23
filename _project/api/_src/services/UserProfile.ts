import { jwt } from "@effect-app/infra/api/express/schema/jwt"
import { NotLoggedInError } from "@effect-app/infra/errors"

/**
 * @tsplus type abc
 */
export class UserProfileScheme extends Model<UserProfileScheme>()({
  /**
   * Mapped from "sub"
   */
  id: prop(StringId).from("sub")
}) {}

export const UserProfileId = Symbol()

/**
 * @tsplus type UserProfile
 * @tsplus companion UserProfile.Ops
 */
export abstract class UserProfile extends ServiceTaggedClass<UserProfile>()(UserProfileId) {
  abstract get: Effect<never, NotLoggedInError, UserProfileScheme>
}

export const LiveUserProfile = (profile: UserProfileScheme | null) =>
  Effect(UserProfile.make({
    get: Option.fromNullable(profile).encaseInEffect(() => new NotLoggedInError())
  }))
    .toLayer(UserProfile)

const userProfileFromJson = json[">>>"](UserProfileScheme)
const userProfileFromJWT = jwt[">>>"](UserProfileScheme)
export const makeUserProfileFromAuthorizationHeader = (
  authorization: string | undefined
) => userProfileFromJWT.parseCondemnCustom(authorization)
export const makeUserProfileFromUserHeader = (user: string | string[] | undefined) =>
  userProfileFromJson.parseCondemnCustom(user)
