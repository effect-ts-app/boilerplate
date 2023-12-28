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
    roles: array(NonEmptyString255).mapFrom("https://nomizz.com/roles").withDefault()
  })
) {
}

export namespace UserProfileService {
  export interface Id {
    readonly _: unique symbol
  }
}

const userProfileFromJson = S.parseJson(UserProfile)
const userProfileFromJWT = S.compose(jwt, UserProfile)
export const makeUserProfileFromAuthorizationHeader = (
  authorization: string | undefined
) => userProfileFromJWT.parse(authorization)
export const makeUserProfileFromUserHeader = (user: string | string[] | undefined) => userProfileFromJson.parse(user)
