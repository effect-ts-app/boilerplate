import { jwt } from "@effect-app/infra/api/express/schema/jwt"
import { NotLoggedInError } from "@effect-app/infra/errors"
import { UserProfileId } from "@effect-app/prelude/ids"

export class UserProfileScheme extends Model<UserProfileScheme>()({
  sub: UserProfileId
}) {}

export interface UserProfileServiceId {
  readonly _: unique symbol
}

/**
 * @tsplus type UserProfile
 * @tsplus companion UserProfile.Ops
 */
export abstract class UserProfile extends TagClass<UserProfileServiceId, UserProfile>() {
  abstract get: Effect<never, NotLoggedInError, UserProfileScheme>
  static live(profile: Option<UserProfileScheme>): UserProfile {
    return { get: profile.encaseInEffect(() => new NotLoggedInError()) }
  }
}

const userProfileFromJson = json[">>>"](UserProfileScheme)
const userProfileFromJWT = jwt[">>>"](UserProfileScheme)
export const makeUserProfileFromAuthorizationHeader = (
  authorization: string | undefined
) => userProfileFromJWT.parseCondemnCustom(authorization)
export const makeUserProfileFromUserHeader = (user: string | string[] | undefined) =>
  userProfileFromJson.parseCondemnCustom(user)
