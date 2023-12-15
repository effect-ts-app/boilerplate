import { jwt } from "@effect-app/infra/api/express/schema/jwt"
import { UserProfileId } from "@effect-app/prelude/ids"
import { Class, json } from "@effect-app/prelude/schema"

/**
 * @tsplus type UserProfile
 * @tsplus companion UserProfile.Ops
 */
export class UserProfile extends assignTag<UserProfile>()(
  Class<UserProfile>()({
    sub: UserProfileId,
    roles: array(NonEmptyString255).fromProp("https://nomizz.com/roles")
  })
) {
}

export interface UserProfileServiceId {
  readonly _: unique symbol
}

const userProfileFromJson = json[">>>"](UserProfile)
const userProfileFromJWT = jwt[">>>"](UserProfile)
export const makeUserProfileFromAuthorizationHeader = (
  authorization: string | undefined
) => userProfileFromJWT.parseCondemnCustom(authorization)
export const makeUserProfileFromUserHeader = (user: string | string[] | undefined) =>
  userProfileFromJson.parseCondemnCustom(user)
