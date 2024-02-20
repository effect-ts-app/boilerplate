import { User } from "models/User"
import { S } from "resources/lib"

export class UserView extends S.ExtendedClass<UserView, UserView.From>()({
  ...User.pick("id", "role"),
  displayName: S.NonEmptyString2k
}) {}

// codegen:start {preset: model}
//
/* eslint-disable */
export namespace UserView {
  export class From extends S.FromClass<typeof UserView>() {}
}
/* eslint-enable */
//
// codegen:end
//
