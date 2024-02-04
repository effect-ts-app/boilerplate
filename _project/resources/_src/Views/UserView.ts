import { User } from "@effect-app-boilerplate/models/User"
import { Utils } from "@effect-app/prelude"
import { ExtendedClass, FromClass, NonEmptyString2k, useClassFeaturesForSchema } from "@effect-app/prelude/schema"

@useClassFeaturesForSchema
export class UserView extends ExtendedClass<UserView.From, UserView>()({
  ...Utils.pick(User.fields, "id", "role"),
  displayName: NonEmptyString2k
}) {}

// codegen:start {preset: model}
//
/* eslint-disable */
export namespace UserView {
  /**
   * @tsplus type UserView.From
   * @tsplus companion UserView.From/Ops
   */
  export class From extends FromClass<typeof UserView>() {}
}
/* eslint-enable */
//
// codegen:end
//
