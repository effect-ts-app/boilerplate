import * as S from "@fp-ts/schema/Schema"

export const FirstName: Schema<ReasonableString> = ReasonableString
  .annotations({
    [Annotations.CustomId]: { type: "FirstName" },
    [Annotations.ArbitraryHookId]: Hook.hook(() =>
      Arbitrary.make(
        FirstName,
        fc => fakerArb(faker => () => faker.name.firstName())(fc).map(s => s as ReasonableString)
      )
    )
  })
export type FirstName = Infer<typeof FirstName>

export const DisplayName = FirstName
export type DisplayName = Infer<typeof DisplayName>

export const LastName: Schema<ReasonableString> = ReasonableString
  .annotations({
    [Annotations.CustomId]: { type: "LastName" },
    [Annotations.ArbitraryHookId]: Hook.hook(() =>
      Arbitrary.make(
        LastName,
        fc => fakerArb(faker => () => faker.name.lastName())(fc).map(s => s as ReasonableString)
      )
    )
  })
export type LastName = Infer<typeof LastName>

// somehow must use S.struct, or tsplus breaks as soon as @tsplus type annotation is added
export const FullName = S.struct({
  firstName: FirstName,
  lastName: LastName
})

/**
 * @tsplus type FullName
 */
export interface FullName extends Infer<typeof FullName> {}

// @useClassNameForSchema
// export class FullName extends MNModel<
//   FullName,
//   FullName.ConstructorInput,
//   FullName.Encoded,
//   FullName.Props
// >()({
//   firstName: prop(FirstName),
//   lastName: prop(LastName)
// }) {
//   static render(this: void, fn: FullName) {
//     return LongString(`${fn.firstName} ${fn.lastName}`)
//   }

//   static create(this: void, firstName: FirstName, lastName: LastName) {
//     return new FullName({ firstName, lastName })
//   }
// }
// /** @ignore @internal @deprecated */
// export type FullNameConstructor = typeof FullName

/**
 * @tsplus getter FullName show
 */
export function showFullName(fn: FullName) {
  return LongString(`${fn.firstName} ${fn.lastName}`)
}

// /**
//  * @tsplus static FullName.Encoded.Ops create
//  */
// export function createFullName(firstName: string, lastName: string): FullName {
//   return { firstName, lastName }
// }

export const UserId = StringId
export type UserId = StringId

export const Role = Schema.literal("manager", "user")
export type Role = Infer<typeof Role>

export const User = S.struct({
  id: UserId
})

// /**
//  * @tsplus type User
//  * @tsplus companion User
//  */
// @useClassNameForSchema
// export class User extends MNModel<User, User.ConstructorInput, User.Encoded, User.Props>()({
//   id: defaultProp(UserId, UserId.make),
//   displayName: prop(DisplayName),
//   role: prop(Role)
// }) {}

// /**
//  * @tsplus getter User show
//  */
// export function showUser(user: User) {
//   return user.displayName
// }

// function getProps(u: User) {
//   return makePreparedLenses(User.Api.props, u)
// }

// /**
//  * @tsplus getter User props
//  */
// export const props = lazyGetter(getProps)

// /**
//  * @tsplus static User equal
//  */
// export const defaultEqual = Equal.string.contramap((u: User) => u.id)

// // TODO
// // let userPool: readonly User[] | null = null
// // export function setUserPool(pool: readonly User[] | null) {
// //   userPool = pool
// // }

// // const User___ = union({ RegisteredUser, Guest, Ghost, Archived })
// // const userArb = Arbitrary.for(User___)
// // const User_ = enhanceClassUnion(
// //   OpaqueSchema<User, User.Encoded>()(User___)
// //     ["|>"](arbitrary(_ => (userPool ? _.constantFrom(...userPool) : userArb(_))))
// //     ["|>"](withDefaults)

// /** @ignore @internal @deprecated */
// export type UserConstructor = typeof User

// // codegen:start {preset: model}
// //
// /* eslint-disable */
// export interface FullName {
//   readonly firstName: unknown
//   readonly lastName: unknown
// }
// export namespace FullName {
//   /**
//    * @tsplus type FullName.Encoded
//    */
//   export interface Encoded {
//     readonly firstName: unknown
//     readonly lastName: unknown
//   }
//   export const Encoded: EncodedOps = { $: {} }
//   /**
//    * @tsplus type FullName.Encoded/Aspects
//    */
//   export interface EncodedAspects {}
//   /**
//    * @tsplus type FullName.Encoded/Ops
//    */
//   export interface EncodedOps { $: EncodedAspects }
//   export interface ConstructorInput
//     extends ConstructorInputFromApi<typeof FullName> {}
//   export interface Props extends GetProvidedProps<typeof FullName> {}
// }
// export interface User {
//   readonly displayName: unknown
//   readonly id: StringId
//   readonly role: Role
// }
// export namespace User {
//   /**
//    * @tsplus type User.Encoded
//    */
//   export interface Encoded {
//     readonly displayName: unknown
//     readonly id: string
//     readonly role: Role
//   }
//   export const Encoded: EncodedOps = { $: {} }
//   /**
//    * @tsplus type User.Encoded/Aspects
//    */
//   export interface EncodedAspects {}
//   /**
//    * @tsplus type User.Encoded/Ops
//    */
//   export interface EncodedOps { $: EncodedAspects }
//   export interface ConstructorInput
//     extends ConstructorInputFromApi<typeof User> {}
//   export interface Props extends GetProvidedProps<typeof User> {}
// }
// /* eslint-enable */
// //
// // codegen:end
// //
// /* eslint-disable */
