import { User } from "@effect-app-boilerplate/models/User"
import { S } from "@effect-app/prelude"

export class UserView extends S.ExtendedClass<UserView.From, UserView>()({
  ...User.pick("id", "role"),
  displayName: S.NonEmptyString2k
}) {}

// codegen:start {preset: model}
//
/* eslint-disable */
export namespace UserView {
  /**
   * @tsplus type UserView.From
   * @tsplus companion UserView.From/Ops
   */
  export class From extends S.FromClass<typeof UserView>() {}
}
/* eslint-enable */
//
// codegen:end
//
