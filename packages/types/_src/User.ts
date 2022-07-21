import type { ParsedShapeOfCustom } from "@effect-ts-app/boilerplate-prelude/schema"
import { arbitrary, fakerArb, MNModel, ReasonableString } from "@effect-ts-app/boilerplate-prelude/schema"

export const FirstName = ReasonableString["|>"](
  arbitrary(FC =>
    // eslint-disable-next-line @typescript-eslint/unbound-method
    fakerArb(faker => faker.name.firstName)(FC).map(x => x as ReasonableString)
  )
)
export type FirstName = ParsedShapeOfCustom<typeof FirstName>

export const DisplayName = FirstName
export type DisplayName = ParsedShapeOfCustom<typeof DisplayName>

export const LastName = ReasonableString["|>"](
  arbitrary(FC =>
    // eslint-disable-next-line @typescript-eslint/unbound-method
    fakerArb(faker => faker.name.lastName)(FC).map(x => x as ReasonableString)
  )
)
export type LastName = ParsedShapeOfCustom<typeof LastName>

export class FullName extends MNModel<
  FullName,
  FullName.ConstructorInput,
  FullName.Encoded,
  FullName.Props
>("FullName")({
  firstName: prop(FirstName),
  lastName: prop(LastName)
}) {
  static render(this: void, fn: FullName) {
    return `${fn.firstName} ${fn.lastName}` as ReasonableString
  }

  static create(this: void, firstName: FirstName, lastName: LastName) {
    return new FullName({ firstName, lastName })
  }
}
// @ts-expect-error bla
// eslint-disable-next-line unused-imports/no-unused-vars
type FullNameConstructor = typeof FullName

/**
 * @tsplus static FullName.Encoded.Ops create
 */
export function createFullName(firstName: string, lastName: string) {
  return { firstName, lastName }
}

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
export interface FullName {
  readonly firstName: ReasonableString
  readonly lastName: ReasonableString
}
export namespace FullName {
  /**
   * @tsplus type FullName.Encoded
   */
  export interface Encoded {
    readonly firstName: string
    readonly lastName: string
  }
  export const Encoded: EncodedOps = { $: {} }
  /**
   * @tsplus type FullName.Encoded/Aspects
   */
  export interface EncodedAspects {}
  /**
   * @tsplus type FullName.Encoded/Ops
   */
  export interface EncodedOps { $: EncodedAspects }
  export interface ConstructorInput
    extends ConstructorInputFromApi<typeof FullName> {}
  export interface Props extends GetProvidedProps<typeof FullName> {}
}
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