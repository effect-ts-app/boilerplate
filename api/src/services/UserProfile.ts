import { parseJwt } from "@effect-app/infra/api/routing/schema/jwt"
import { S } from "effect-app"
import { UserProfileId } from "effect-app/ids"
import { assignTag } from "effect-app/service"
import { Role } from "models/User.js"

export class UserProfile extends assignTag<UserProfile>()(
  S.Class<UserProfile>()({
    sub: UserProfileId,
    roles: S.array(Role).withDefault.pipe(S.fromKey("https://nomizz.com/roles"))
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
) => S.decodeUnknown(userProfileFromJWT)(authorization)
export const makeUserProfileFromUserHeader = (user: string | string[] | undefined) =>
  S.decodeUnknown(userProfileFromJson)(user)
