import { UserProfileId } from "@effect-app/prelude/ids"
import { makePreparedLenses } from "@effect-app/prelude/schema"

export const FirstName = ReasonableString
  ["|>"](
    arbitrary((FC) =>
      // eslint-disable-next-line @typescript-eslint/unbound-method
      fakerArb((faker) => faker.name.firstName)(FC).map((x) => x as ReasonableString)
    )
  )
  ["|>"](withDefaults)
export type FirstName = ParsedShapeOfCustom<typeof FirstName>

export const DisplayName = FirstName
export type DisplayName = ParsedShapeOfCustom<typeof DisplayName>

export const LastName = ReasonableString
  ["|>"](
    arbitrary((FC) =>
      // eslint-disable-next-line @typescript-eslint/unbound-method
      fakerArb((faker) => faker.name.lastName)(FC).map((x) => x as ReasonableString)
    )
  )
  ["|>"](withDefaults)
export type LastName = ParsedShapeOfCustom<typeof LastName>

/**
 * @tsplus type FullName
 */
@useClassFeaturesForSchema
export class FullName extends MNModel<
  FullName,
  FullName.ConstructorInput,
  FullName.Encoded,
  FullName.Props
>()({
  firstName: FirstName,
  lastName: LastName
}) {
  static render(this: void, fn: FullName) {
    return LongString(`${fn.firstName} ${fn.lastName}`)
  }

  static make(this: void, firstName: FirstName, lastName: LastName) {
    return new FullName({ firstName, lastName })
  }
}

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

export const UserId = UserProfileId
export type UserId = UserProfileId

export const Role = literal("manager", "user")
export type Role = ParsedShapeOfCustom<typeof Role>

/**
 * @tsplus type User
 * @tsplus companion User
 */
@useClassFeaturesForSchema
export class User extends MNModel<User, User.ConstructorInput, User.Encoded, User.Props>()({
  id: UserId.withDefault,
  displayName: DisplayName,
  role: Role
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

// codegen:start {preset: model}
//
/* eslint-disable */
export namespace FullName {
  /**
   * @tsplus type FullName.Encoded
   * @tsplus companion FullName.Encoded/Ops
   */
  export class Encoded extends EncodedClass<typeof FullName>() {}
  export interface ConstructorInput
    extends ConstructorInputFromApi<typeof FullName> {}
  export interface Props extends GetProvidedProps<typeof FullName> {}
}
export namespace User {
  /**
   * @tsplus type User.Encoded
   * @tsplus companion User.Encoded/Ops
   */
  export class Encoded extends EncodedClass<typeof User>() {}
  export interface ConstructorInput
    extends ConstructorInputFromApi<typeof User> {}
  export interface Props extends GetProvidedProps<typeof User> {}
}
/* eslint-enable */
//
// codegen:end
//
