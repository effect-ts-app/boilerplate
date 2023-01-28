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

export interface UserProfile extends ServiceTagged<typeof UserProfileId> {
  get: Effect<never, NotLoggedInError, UserProfileScheme>
}
export const UserProfile = Tag<UserProfile>()

export const LiveUserProfile = (profile: UserProfileScheme | null) =>
  UserProfile.makeLayer(
    UserProfile.make({
      get: Option.fromNullable(profile).encaseInEffect(() => new NotLoggedInError())
    })
  )

const userProfileFromJson = json[">>>"](UserProfileScheme)
const userProfileFromJWT = jwt[">>>"](UserProfileScheme)
export const makeUserProfileFromAuthorizationHeader = (
  authorization: string | undefined
) => userProfileFromJWT.parseCondemnCustom(authorization)
export const makeUserProfileFromUserHeader = (user: string | string[] | undefined) =>
  userProfileFromJson.parseCondemnCustom(user)
