import { User } from "models/User.js"
import { S } from "resources/lib.js"

export class UserView extends S.ExtendedClass<UserView, UserView.Encoded>()({
  ...User.pick("id", "role"),
  displayName: S.NonEmptyString2k
}) {}

// codegen:start {preset: model}
//
/* eslint-disable */
export namespace UserView {
  export interface Encoded extends S.Struct.Encoded<typeof UserView["fields"]> {}
}
/* eslint-enable */
//
// codegen:end
//
