import { Role } from "@effect-app-boilerplate/models/User"
import { parseJwt } from "@effect-app/infra/api/express/schema/jwt"
import { UserProfileId } from "@effect-app/prelude/ids"
import { Class } from "@effect-app/schema"

/**
 * @tsplus type UserProfile
 * @tsplus companion UserProfile.Ops
 */
export class UserProfile extends assignTag<UserProfile>()(
  Class<UserProfile>()({
    sub: UserProfileId,
    roles: S.array(Role).mapFrom("https://nomizz.com/roles").withDefault
  })
) {
}

export namespace UserProfileService {
  export interface Id {
    readonly _: unique symbol
  }
}

const userProfileFromJson = S.parseJson(UserProfile)
const userProfileFromJWT = parseJwt(UserProfile)
export const makeUserProfileFromAuthorizationHeader = (
  authorization: string | undefined
) => userProfileFromJWT.decodeUnknown(authorization)
export const makeUserProfileFromUserHeader = (user: string | string[] | undefined) =>
  userProfileFromJson.decodeUnknown(user)
