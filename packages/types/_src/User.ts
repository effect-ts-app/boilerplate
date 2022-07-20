import { FullName, MNModel } from "@effect-ts-app/boilerplate-prelude/schema"
/* eslint-disable unused-imports/no-unused-imports */

export class User extends MNModel<User, User.ConstructorInput, User.Encoded, User.Props>()({
  id: defaultProp(UUID),
  name: prop(FullName)
}) {}

// @ts-expect-error bla
// eslint-disable-next-line unused-imports/no-unused-vars
type UserConstructor = typeof User

// codegen:start {preset: model}
//
/* eslint-disable */
export interface User {
  readonly id: UUID
  readonly name: FullName
}
export namespace User {
  /**
   * @tsplus type User.Encoded
   */
  export interface Encoded {
    readonly id: string
    readonly name: FullName.Encoded
  }
  export const Encoded: EncodedOps = { $: {} }
  /**
   * @tsplus type User.Encoded/Aspects
   */
  export interface EncodedAspects {}
  /**
   * @tsplus type User.Encoded/Ops
   */
  export interface EncodedOps { $: EncodedAspects }
  export interface ConstructorInput
    extends ConstructorInputFromApi<typeof User> {}
  export interface Props extends GetProvidedProps<typeof User> {}
}
/* eslint-enable */
//
// codegen:end
//
/* eslint-disable */