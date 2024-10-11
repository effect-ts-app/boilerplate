/* eslint-disable @typescript-eslint/unbound-method */
import * as A from "@effect/schema/Arbitrary"
import { type Schema } from "@effect/schema/Schema"
import { Context, Effect, Equivalence, pipe, S } from "effect-app"
import { fakerArb } from "effect-app/faker"
import { UserProfileId } from "effect-app/ids"

export const FirstName = S
  .NonEmptyString255
  .pipe(
    S.annotations({
      [A.ArbitraryHookId]: (): A.LazyArbitrary<string> => (fc) => fc.string()
    }),
    S.withDefaultMake
  )

export type FirstName = Schema.Type<typeof FirstName>

export const DisplayName = FirstName
export type DisplayName = Schema.Type<typeof DisplayName>

S.Array(S.NonEmptyString255).pipe(
  S.annotations({ [A.ArbitraryHookId]: (): A.LazyArbitrary<Array<string>> => (fc) => fc.tuple() })
)

export const LastName = S
  .NonEmptyString255
  .pipe(
    S.annotations({
      [A.ArbitraryHookId]: (): A.LazyArbitrary<string> => fakerArb((faker) => faker.person.lastName)
    }),
    S.withDefaultMake
  )

export type LastName = Schema.Type<typeof LastName>

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

export function showFullName(fn: FullName) {
  return FullName.render(fn)
}

export function createFullName(firstName: string, lastName: string) {
  return { firstName, lastName }
}

export const UserId = UserProfileId
export type UserId = UserProfileId

export const Role = S.withDefaultMake(S.Literal("manager", "user"))
export type Role = Schema.Type<typeof Role>

export class UserFromIdResolver
  extends Context.TagId("UserFromId")<UserFromIdResolver, { get: (userId: UserId) => Effect<User> }>()
{}

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
  static readonly resolver = UserFromIdResolver
}

export const UserFromId: Schema<User, string, UserFromIdResolver> = S.transformOrFail(
  UserId,
  S.typeSchema(User),
  { decode: User.resolver.get, encode: (u) => Effect.succeed(u.id) }
)

export const defaultEqual = pipe(Equivalence.string, Equivalence.mapInput((u: User) => u.id))

// codegen:start {preset: model}
//
/* eslint-disable */
export namespace FullName {
  export interface From extends S.Struct.Encoded<typeof FullName["fields"]> {}
}
export namespace User {
  export interface From extends S.Struct.Encoded<typeof User["fields"]> {}
}
/* eslint-enable */
//
// codegen:end
//
