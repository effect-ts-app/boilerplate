import { makePreparedLenses } from "@effect-app/prelude/schema"

export const FirstName = ReasonableString["|>"](
  arbitrary(FC =>
    // eslint-disable-next-line @typescript-eslint/unbound-method
    fakerArb(faker => faker.name.firstName)(FC).map(x => x as ReasonableString)
  )
)["|>"](withDefaults)
export type FirstName = ParsedShapeOfCustom<typeof FirstName>

export const DisplayName = FirstName
export type DisplayName = ParsedShapeOfCustom<typeof DisplayName>

export const LastName = ReasonableString["|>"](
  arbitrary(FC =>
    // eslint-disable-next-line @typescript-eslint/unbound-method
    fakerArb(faker => faker.name.lastName)(FC).map(x => x as ReasonableString)
  )
)["|>"](withDefaults)
export type LastName = ParsedShapeOfCustom<typeof LastName>

/**
 * @tsplus type FullName
 */
@useClassNameForSchema
export class FullName extends MNModel<
  FullName,
  FullName.ConstructorInput,
  FullName.Encoded,
  FullName.Props
>()({
  firstName: prop(FirstName),
  lastName: prop(LastName)
}) {
  static render(this: void, fn: FullName) {
    return LongString(`${fn.firstName} ${fn.lastName}`)
  }

  static create(this: void, firstName: FirstName, lastName: LastName) {
    return new FullName({ firstName, lastName })
  }
}
/** @ignore @internal @deprecated */
export type FullNameConstructor = typeof FullName

/**
 * @tsplus getter FullName show
 */
export function showFullName(fn: FullName) {
  return FullName.render(fn)
}

/**
 * @tsplus static FullName.Encoded.Ops create
 */
export function createFullName(firstName: string, lastName: string) {
  return { firstName, lastName }
}

export const UserId = StringId
export type UserId = StringId

export const Role = literal("manager", "user")
export type Role = ParsedShapeOfCustom<typeof Role>

/**
 * @tsplus type User
 * @tsplus companion User
 */
@useClassNameForSchema
export class User extends MNModel<User, User.ConstructorInput, User.Encoded, User.Props>()({
  id: defaultProp(UserId, UserId.make),
  displayName: prop(DisplayName),
  role: prop(Role)
}) {}

/**
 * @tsplus getter User show
 */
export function showUser(user: User) {
  return user.displayName
}

function getProps(u: User) {
  return makePreparedLenses(User.Api.props, u)
}

/**
 * @tsplus getter User props
 */
export const props = lazyGetter(getProps)

/**
 * @tsplus static User equal
 */
export const defaultEqual = Equivalence.string.contramap((u: User) => u.id)

// TODO
// let userPool: readonly User[] | null = null
// export function setUserPool(pool: readonly User[] | null) {
//   userPool = pool
// }

// const User___ = union({ RegisteredUser, Guest, Ghost, Archived })
// const userArb = Arbitrary.for(User___)
// const User_ = enhanceClassUnion(
//   OpaqueSchema<User, User.Encoded>()(User___)
//     ["|>"](arbitrary(_ => (userPool ? _.constantFrom(...userPool) : userArb(_))))
//     ["|>"](withDefaults)

/** @ignore @internal @deprecated */
export type UserConstructor = typeof User

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
  readonly displayName: ReasonableString
  readonly id: StringId
  readonly role: Role
}
export namespace User {
  /**
   * @tsplus type User.Encoded
   */
  export interface Encoded {
    readonly displayName: string
    readonly id: string
    readonly role: Role
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