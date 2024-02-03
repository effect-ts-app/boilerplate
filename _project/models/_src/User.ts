/* eslint-disable @typescript-eslint/unbound-method */
import { fakerArb } from "@effect-app/prelude/faker"
import { UserProfileId } from "@effect-app/prelude/ids"
import { A } from "@effect-app/schema"
import { Equivalence } from "effect"

export const FirstName = NonEmptyString255
  .annotations({
    [A.ArbitraryHookId]: (): A.Arbitrary<string> => fakerArb((faker) => faker.person.firstName)
  })
  .withDefaults

export type FirstName = Schema.To<typeof FirstName>

export const DisplayName = FirstName
export type DisplayName = Schema.To<typeof DisplayName>

export const LastName = NonEmptyString255
  .annotations({
    [A.ArbitraryHookId]: (): A.Arbitrary<string> => fakerArb((faker) => faker.person.lastName)
  })
  .withDefaults

export type LastName = Schema.To<typeof LastName>

/**
 * @tsplus type FullName
 */
@useClassFeaturesForSchema
export class FullName extends ExtendedClass<
  FullName.From,
  FullName
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

export const Role = literal("manager", "user").withDefaults
export type Role = Schema.To<typeof Role>

/**
 * @tsplus type User
 * @tsplus companion User
 */
@useClassFeaturesForSchema
export class User extends ExtendedClass<User.From, User>()({
  id: UserId.withDefault(),
  displayName: DisplayName,
  role: Role,
  passwordHash: NonEmptyString255
}) {
  static readonly resolver = Context.Tag<UserFromId, (userId: UserId) => Effect<never, never, User>>()
}

export interface UserFromId {
  readonly _: unique symbol
}

export const UserFromId: Schema<UserFromId, string, User> = S.transformOrFail(
  UserId,
  S.to(User),
  (id) => User.resolver.andThen((_) => _(id)),
  (u) => Effect.succeed(u.id)
)

/**
 * @tsplus getter User show
 */
export function showUser(user: User) {
  return user.displayName
}

/**
 * @tsplus static User equal
 */
export const defaultEqual = Equivalence.string.mapInput((u: User) => u.id)

// codegen:start {preset: model}
//
/* eslint-disable */
export namespace FullName {
  /**
   * @tsplus type FullName.From
   * @tsplus companion FullName.From/Ops
   */
  export class From extends FromClass<typeof FullName>() {}
}
export namespace User {
  /**
   * @tsplus type User.From
   * @tsplus companion User.From/Ops
   */
  export class From extends FromClass<typeof User>() {}
}
/* eslint-enable */
//
// codegen:end
//
