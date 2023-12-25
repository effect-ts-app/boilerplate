import { jwt } from "@effect-app/infra/api/express/schema/jwt"
import { UserProfileId } from "@effect-app/prelude/ids"
import { Class, S } from "@effect-app/schema"

/**
 * @tsplus type UserProfile
 * @tsplus companion UserProfile.Ops
 */
export class UserProfile extends assignTag<UserProfile>()(
  Class<UserProfile>()({
    sub: UserProfileId,
    ["https://nomizz.com/roles"]: array(NonEmptyString255) // TODO: "roles"
  })
) {
  // TODO
  get roles() {
    return this["https://nomizz.com/roles"]
  }
}

export interface UserProfileServiceId {
  readonly _: unique symbol
}

const userProfileFromJson = S.parseJson(UserProfile)
const userProfileFromJWT = S.compose(jwt, UserProfile)
export const makeUserProfileFromAuthorizationHeader = (
  authorization: string | undefined
) => userProfileFromJWT.parse(authorization)
export const makeUserProfileFromUserHeader = (user: string | string[] | undefined) => userProfileFromJson.parse(user)
