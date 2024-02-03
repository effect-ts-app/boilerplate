import { User } from "@effect-app-boilerplate/models/User"

@useClassFeaturesForSchema
export class UserView extends ExtendedClass<UserView.From, UserView>()({
  ...User.fields.$$.pick("id", "displayName", "role")
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
