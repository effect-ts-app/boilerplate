import { lazyGetter } from "@effect-app/core/utils"
import { UserProfileId } from "@effect-app/prelude/ids"
import type { ConstructorInputApi, FieldsClass, To } from "@effect-app/prelude/schema"
import {
  arbitrary,
  ExtendedClass,
  fakerArb,
  FromClass,
  literal,
  makePreparedLenses,
  NonEmptyString255,
  NonEmptyString2k,
  useClassFeaturesForSchema,
  withDefaults
} from "@effect-app/prelude/schema"
import { Equivalence } from "effect"

export const FirstName = NonEmptyString255
  .pipe(
    arbitrary((FC) =>
      // eslint-disable-next-line @typescript-eslint/unbound-method
      fakerArb((faker) => faker.person.firstName)(FC).map((x) => x as NonEmptyString255)
    ),
    withDefaults
  )
export type FirstName = To<typeof FirstName>

export const DisplayName = FirstName
export type DisplayName = To<typeof DisplayName>

export const LastName = NonEmptyString255
  .pipe(
    arbitrary((FC) =>
      // eslint-disable-next-line @typescript-eslint/unbound-method
      fakerArb((faker) => faker.person.lastName)(FC).map((x) => x as NonEmptyString255)
    ),
    withDefaults
  )
export type LastName = To<typeof LastName>

/**
 * @tsplus type FullName
 */
@useClassFeaturesForSchema
export class FullName extends ExtendedClass<
  FullName,
  FullName.ConstructorInput,
  FullName.From,
  FullName.Fields
>()({
  firstName: FirstName,
  lastName: LastName
}) {
  static render(this: void, fn: FullName) {
    return NonEmptyString2k(`${fn.firstName} ${fn.lastName}`)
  }

  static create(this: void, firstName: FirstName, lastName: LastName) {
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
 * @tsplus static FullName.From.Ops create
 */
export function createFullName(firstName: string, lastName: string) {
  return { firstName, lastName }
}

export const UserId = UserProfileId
export type UserId = UserProfileId

export const Role = literal("manager", "user")
export type Role = To<typeof Role>

/**
 * @tsplus type User
 * @tsplus companion User
 */
@useClassFeaturesForSchema
export class User extends ExtendedClass<User, User.ConstructorInput, User.From, User.Fields>()({
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
  return makePreparedLenses(User.Api.fields, u)
}

/**
 * @tsplus getter User props
 */
export const props = lazyGetter(getProps)

/**
 * @tsplus static User equal
 */
export const defaultEqual = Equivalence.string.mapInput((u: User) => u.id)

// TODO
// let userPool: readonly User[] | null = null
// export function setUserPool(pool: readonly User[] | null) {
//   userPool = pool
// }

// const User___ = union({ RegisteredUser, Guest, Ghost, Archived })
// const userArb = Arbitrary.for(User___)
// const User_ = enhanceClassUnion(
//   OpaqueSchema<User, User.From>()(User___)
//     ["|>"](arbitrary(_ => (userPool ? _.constantFrom(...userPool) : userArb(_))))
//     ["|>"](withDefaults)

// codegen:start {preset: model}
//
/* eslint-disable */
export namespace FullName {
  /**
   * @tsplus type FullName.From
   * @tsplus companion FullName.From/Ops
   */
  export class From extends FromClass<typeof FullName>() {}
  export interface ConstructorInput
    extends ConstructorInputApi<typeof FullName> {}
  export interface Fields extends FieldsClass<typeof FullName> {}
}
export namespace User {
  /**
   * @tsplus type User.From
   * @tsplus companion User.From/Ops
   */
  export class From extends FromClass<typeof User>() {}
  export interface ConstructorInput
    extends ConstructorInputApi<typeof User> {}
  export interface Fields extends FieldsClass<typeof User> {}
}
/* eslint-enable */
//
// codegen:end
//
