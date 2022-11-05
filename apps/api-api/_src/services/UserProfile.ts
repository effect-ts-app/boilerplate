import * as MO from "@effect-ts-app/boilerplate-prelude/schema"
import { NotLoggedInError } from "@effect-ts-app/infra/errors"
import { jwt } from "@effect-ts-app/infra/express/schema/jwt"

export class UserProfileScheme extends MO.Model<UserProfileScheme>()({
  /**
   * Mapped from "sub"
   */
  id: propFrom(MO.prop(UUID), "sub")
}) {}

export interface UserProfile {
  get: Effect<never, NotLoggedInError, UserProfileScheme>
}
export const UserProfile = Tag<UserProfile>()

export const LiveUserProfile = (profile: UserProfileScheme | null) =>
  Layer.fromValue(UserProfile, { get: Maybe.fromNullable(profile).encaseInEffect(() => new NotLoggedInError()) })

const userProfileFromJson = MO.json[">>>"](UserProfileScheme)
const userProfileFromJWT = jwt[">>>"](UserProfileScheme)
export const makeUserProfileFromAuthorizationHeader = (
  authorization: string | undefined
) => userProfileFromJWT.parseCondemnCustom(authorization)
export const makeUserProfileFromUserHeader = (user: string | string[] | undefined) =>
  userProfileFromJson.parseCondemnCustom(user)
