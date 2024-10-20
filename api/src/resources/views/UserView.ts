import { User } from "models/User.js"
import { S } from "resources/lib.js"

export class UserView extends S.ExtendedClass<UserView, UserView.From>()({
  ...User.pick("woot", "role"),
  displayName: S.NonEmptyString2k
}) {}

// codegen:start {preset: model}
//
/* eslint-disable */
export namespace UserView {
  export interface From extends S.Struct.Encoded<typeof UserView["fields"]> {}
}
/* eslint-enable */
//
// codegen:end
//
