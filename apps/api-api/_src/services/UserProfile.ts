import { json, Model, prop, propFrom } from "@effect-ts-app/boilerplate-prelude/schema"
import { NotLoggedInError } from "@effect-ts-app/infra/errors"
import { jwt } from "@effect-ts-app/infra/express/schema/jwt"

export class UserProfileScheme extends Model<UserProfileScheme>()({
  /**
   * Mapped from "sub"
   */
  id: propFrom(prop(StringId), "sub")
}) {}

export const UserProfileId = Symbol()

export interface UserProfile extends ServiceTagged<typeof UserProfileId> {
  get: Effect<never, NotLoggedInError, UserProfileScheme>
}
export const UserProfile = Tag<UserProfile>()

export const LiveUserProfile = (profile: UserProfileScheme | null) =>
  UserProfile.makeLayer(
    UserProfile.make({
      get: Opt.fromNullable(profile).encaseInEffect(() => new NotLoggedInError())
    })
  )

const userProfileFromJson = json[">>>"](UserProfileScheme)
const userProfileFromJWT = jwt[">>>"](UserProfileScheme)
export const makeUserProfileFromAuthorizationHeader = (
  authorization: string | undefined
) => userProfileFromJWT.parseCondemnCustom(authorization)
export const makeUserProfileFromUserHeader = (user: string | string[] | undefined) =>
  userProfileFromJson.parseCondemnCustom(user)
