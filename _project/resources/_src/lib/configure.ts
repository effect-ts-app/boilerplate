import type { Role } from "@effect-app-boilerplate/models/User"

export type RequestConfig = { allowAnonymous?: true; allowedRoles?: readonly Role[] }

// export const configure = <T extends object>(
//   props: Config,
//   t: T
// ) => Object.assign(t, props)

export const cfg = <C extends RequestConfig>(props: C) => props

// export const cfg =
//   <Args extends readonly any[], Args2 extends readonly any[], Args3 extends readonly any[], O extends object, A>(
//     props: Config,
//     f: (...args: Args) => <A>(...args: Args2) => (...args: Args3) => O
//   ) =>
//   (...args: Args) =>
//   (...args2: Args2) =>
//   (...args3: Args3) => configure(props, f(...args)<A>(...args2)(...args3))

// TODO
export type AllowAnonymous<A> = A extends { allowAnonymous: true } ? true : false
// export type AllowedRoles<A> = A extends { allowedRoles: readonly string[] } ? true : false
