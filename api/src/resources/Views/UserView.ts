import { User } from "models/User.js"
import { S } from "resources/lib.js"

export class UserView extends S.ExtendedClass<UserView, UserView.From>()({
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
