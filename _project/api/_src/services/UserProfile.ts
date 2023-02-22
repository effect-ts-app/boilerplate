import { jwt } from "@effect-app/infra/api/express/schema/jwt"
import { NotLoggedInError } from "@effect-app/infra/errors"
import { json, Model, prop, propFrom } from "@effect-app/prelude/schema"

export class UserProfileScheme extends Model<UserProfileScheme>()({
  /**
   * Mapped from "sub"
   */
  id: propFrom(prop(StringId), "sub")
}) {}

export const UserProfileId = Symbol()

/**
 * @tsplus type UserProfile
 * @tsplus companion UserProfile.Ops
 */
export abstract class UserProfile extends TagBaseTagged<Tag<UserProfile>>()(UserProfileId) {
  abstract get: Effect<never, NotLoggedInError, UserProfileScheme>
}

export const LiveUserProfile = (profile: UserProfileScheme | null) =>
  Effect(UserProfile.make({
    get: Option.fromNullable(profile).encaseInEffect(() => new NotLoggedInError())
  })).toLayer(UserProfile)

const userProfileFromJson = json[">>>"](UserProfileScheme)
const userProfileFromJWT = jwt[">>>"](UserProfileScheme)
export const makeUserProfileFromAuthorizationHeader = (
  authorization: string | undefined
) => userProfileFromJWT.parseCondemnCustom(authorization)
export const makeUserProfileFromUserHeader = (user: string | string[] | undefined) =>
  userProfileFromJson.parseCondemnCustom(user)
