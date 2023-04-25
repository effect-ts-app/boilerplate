import { jwt } from "@effect-app/infra/api/express/schema/jwt"
import { NotLoggedInError } from "@effect-app/infra/errors"
import { UserProfileId } from "@effect-app/prelude/ids"

export class UserProfileScheme extends Model<UserProfileScheme>()({
  sub: UserProfileId
}) {}

export const UserProfileTagId = Symbol()

/**
 * @tsplus type UserProfile
 * @tsplus companion UserProfile.Ops
 */
export abstract class UserProfile extends ServiceTaggedClass<UserProfile>()(UserProfileTagId) {
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
