/* eslint-disable @typescript-eslint/unbound-method */
import { pipe } from "@effect-app/core/Function"
import { S } from "@effect-app/prelude"
import { fakerArb } from "@effect-app/prelude/faker"
import { UserProfileId } from "@effect-app/prelude/ids"
import { A } from "@effect-app/schema"
import { type Schema } from "@effect/schema/Schema"
import { Equivalence } from "effect"

export const FirstName = S
  .NonEmptyString255
  .pipe(
    S.annotations({
      [A.ArbitraryHookId]: (): A.Arbitrary<string> => fakerArb((faker) => faker.person.firstName)
    }),
    S.withDefaults
  )

export type FirstName = Schema.To<typeof FirstName>

export const DisplayName = FirstName
export type DisplayName = Schema.To<typeof DisplayName>

export const LastName = S
  .NonEmptyString255
  .pipe(
    S.annotations({
      [A.ArbitraryHookId]: (): A.Arbitrary<string> => fakerArb((faker) => faker.person.lastName)
    }),
    S.withDefaults
  )

export type LastName = Schema.To<typeof LastName>

/**
 * @tsplus type FullName
 */
export class FullName extends S.ExtendedClass<FullName, FullName.From>()({
  firstName: FirstName,
  lastName: LastName
}) {
  static render(this: void, fn: FullName) {
    return S.NonEmptyString2k(`${fn.firstName} ${fn.lastName}`)
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

export const Role = S.withDefaults(S.literal("manager", "user"))
export type Role = Schema.To<typeof Role>

/**
 * @tsplus type User
 * @tsplus companion User
 */
export class User extends S.ExtendedClass<User, User.From>()({
  id: UserId.withDefault,
  name: FullName,
  email: S.Email,
  role: Role,
  passwordHash: S.NonEmptyString255
}) {
  get displayName() {
    return S.NonEmptyString2k(this.name.firstName + " " + this.name.lastName)
  }
}

export interface UserFromId {
  readonly _: unique symbol
}

/**
 * @tsplus static User equal
 */
export const defaultEqual = pipe(Equivalence.string, Equivalence.mapInput((u: User) => u.id))

// codegen:start {preset: model}
//
/* eslint-disable */
export namespace FullName {
  /**
   * @tsplus type FullName.From
   * @tsplus companion FullName.From/Ops
   */
  export class From extends S.FromClass<typeof FullName>() {}
}
export namespace User {
  /**
   * @tsplus type User.From
   * @tsplus companion User.From/Ops
   */
  export class From extends S.FromClass<typeof User>() {}
}
/* eslint-enable */
//
// codegen:end
//
