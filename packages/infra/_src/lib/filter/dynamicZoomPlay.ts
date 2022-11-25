import type { FocusInitial, FocusPrimitive, FocusStructure } from "@fp-ts/optic/experimental"

import { ZoomerTypeId } from "@fp-ts/optic/experimental"
import type { FieldValues } from "./types/fields"
import type { FieldPath, FieldPathValue } from "./types/index.js"

const focus = <S>(
  ops: Array<PropertyKey> = []
): FocusStructure<S> =>
  // @ts-expect-error
  new Proxy(new Function(), {
    get: (_, prop) => {
      if (prop === ZoomerTypeId) {
        return ops
      }
      return focus([...ops, prop])
    }
  })

export interface PropertyPath<S, A> {
  _S: S
  _A: A
  path: string
}

// export const zoom: {
//   <S, A, P extends string>(f: (s: FocusInitial<S>) => FocusStructure<A>): PropertyPath<S, A, P>
//   <S, A, P extends string>(f: (s: FocusInitial<S>) => FocusPrimitive<A>): PropertyPath<S, A, P>
// } = (f: any): any => {
//   const x = f(focus() as any)
//   return {
//     path: x.join(".")
//   } as any
// }

export type Where<V> = { key: string; t?: "eq" | "not-eq"; value: V } | {
  key: string
  t: "in" | "not-in"
  value: readonly (V)[]
}

function makeFilter<T extends "in" | "not-in" | "eq" | "not-eq">(path: any, value: any, t: T) {
  return { key: typeof path === "string" ? path : (path(focus() as any)[ZoomerTypeId]).join("."), t, value }
}

type Filter<S, K extends string, T extends "in" | "not-in" | "eq" | "not-eq", V> = {
  key: K
  t: T
  value: V
  readonly S: S
}

// function makeHelpers_2<S>() {
//   function _in<A>(
//     path: (s: FocusInitial<S>) => FocusStructure<A>,
//     value: readonly A[]
//   ): Filter<string, "in", readonly A[]>
//   function _in<A>(
//     path: (s: FocusInitial<S>) => FocusPrimitive<A>,
//     value: readonly A[]
//   ): Filter<string, "in", readonly A[]>
//   function _in<A>(
//     path: any,
//     value: readonly A[]
//   ): Filter<string, "in", readonly A[]> {
//     return makeFilter(path, value, "in")
//   }

//   function _notIn<A>(
//     path: (s: FocusInitial<S>) => FocusStructure<A>,
//     value: readonly A[]
//   ): Filter<string, "not-in", readonly A[]>
//   function _notIn<A>(
//     path: (s: FocusInitial<S>) => FocusPrimitive<A>,
//     value: readonly A[]
//   ): Filter<string, "not-in", readonly A[]>
//   function _notIn<A>(
//     path: any,
//     value: readonly A[]
//   ): Filter<string, "not-in", readonly A[]> {
//     return makeFilter(path, value, "not-in")
//   }

//   function _eq<A>(
//     path: (s: FocusInitial<S>) => FocusStructure<A>,
//     value: A
//   ): Filter<string, "eq", A>
//   function _eq<A>(
//     path: (s: FocusInitial<S>) => FocusPrimitive<A>,
//     value: A
//   ): Filter<string, "eq", A>
//   function _eq<A>(
//     path: any,
//     value: A
//   ): Filter<string, "eq", A> {
//     return makeFilter(path, value, "eq")
//   }

//   function _notEq<A>(
//     path: (s: FocusInitial<S>) => FocusStructure<A>,
//     value: A
//   ): Filter<string, "not-eq", A>
//   function _notEq<A>(
//     path: (s: FocusInitial<S>) => FocusPrimitive<A>,
//     value: A
//   ): Filter<string, "not-eq", A>
//   function _notEq<A>(
//     path: any,
//     value: A
//   ): Filter<string, "not-eq", A> {
//     return makeFilter(path, value, "not-eq")
//   }

//   return {
//     in: _in,
//     notIn: _notIn,
//     eq: _eq,
//     notEq: _notEq,
//   } satisfies Record<string, (...args: any[]) => Where<any>>
// }

// function makeHelper<S>() {
//   const h = makeHelpers_2<S>()
//   return Object.assign(h.eq, h)
// }

// export function subjectsWhere(
//   makeWhere: (f: typeof subjectFilters) => Where<any> | [Where<any>, ...Where<any>[]],
//   mode?: "or" | "and"
// ) {
//   const f = subjectFilters
//     const m = makeWhere ? makeWhere(f) : []
//     return ({
//       mode,
//       where: (Array.isArray(m) ? m as unknown as [Where<any>, ...Where<any>[]] : [m])
//     })
// }

// const subjectFilters = makeHelper<Subject>()

// const filters1 = subjectsWhere(
//   _ => [
//     _.in(_ => _.b.c, ["something", "somethingElse"]),
//     _.eq(_ => _.a, 1)
//   ]
// )

// console.log(filters1)

type ValueType<V> = {
  t: "in" | "not-in"
  v: readonly V[]
} | { t: "eq" | "not-eq"; v: V }

type TType<T> = T extends ValueType<any> ? T["t"] : never
type VType<T> = T extends ValueType<any> ? T["v"] : never

// type WhereFilters = {
//   <S, A>(path: (s: FocusInitial<S>) => FocusPrimitive<A>, value: A): Filter<S, string, "eq", A>
//   <S, A>(path: (s: FocusInitial<S>) => FocusStructure<A>, value: A): Filter<S, string, "eq", A>
//   <S, A, Val extends ValueType<A>>(
//     path: (s: FocusInitial<S>) => FocusStructure<A>,
//     value: Val
//   ): Filter<S, string, TType<Val>, VType<Val>>
//   <S, A, Val extends ValueType<A>>(
//     path: (s: FocusInitial<S>) => FocusPrimitive<A>,
//     value: Val
//   ): Filter<S, string, TType<Val>, VType<Val>>
// }

// type WhereFilters2<S> = {
//   <A>(path: (s: FocusInitial<S>) => FocusPrimitive<A>, value: A): Filter<S, string, "eq", A>
//   <A>(path: (s: FocusInitial<S>) => FocusStructure<A>, value: A): Filter<S, string, "eq", A>
//   <A, Val extends ValueType<A>>(
//     path: (s: FocusInitial<S>) => FocusStructure<A>,
//     value: Val
//   ): Filter<S, string, TType<Val>, VType<Val>>
//   <A, Val extends ValueType<A>>(
//     path: (s: FocusInitial<S>) => FocusPrimitive<A>,
//     value: Val
//   ): Filter<S, string, TType<Val>, VType<Val>>
// }

// declare const where: {
//   <A>(path: (s: FocusInitial<Subject>) => FocusPrimitive<A>, value: A): Filter<S,string, "eq", A>,
//   <A>(path: (s: FocusInitial<Subject>) => FocusStructure<A>, value: A): Filter<S,string, "eq", A>,
//   <A, Val extends ValueType<A>>(path: (s: FocusInitial<Subject>) => FocusStructure<A>, value: Val): Filter<S,string, TType<Val>, VType<Val>>,
//   <A, Val extends ValueType<A>>(path: (s: FocusInitial<Subject>) => FocusPrimitive<A>, value: Val): Filter<S,string, TType<Val>, VType<Val>>,
// }

// declare const where: WhereFilters

// function $in<A extends string>(v: readonly A[]): { t: "in"; v: readonly A[] }
function $in<L extends readonly any[]>(v: L) {
  return { t: "in" as const, v }
}

function $notIn<L extends readonly any[]>(v: L) {
  return { t: "not-in" as const, v }
}
function $is<A>(v: A) {
  return { t: "eq" as const, v }
}
function $isnt<A>(v: A) {
  return { t: "not-eq" as const, v }
}

function $contains<A>(v: A) {
  return { t: "contains" as const, v }
}
function $notContains<A>(v: A) {
  return { t: "not-contains" as const, v }
}
function $includes<A extends string>(v: A) {
  return { t: "includes" as const, v }
}
function $startsWith<A extends string>(v: A) {
  return { t: "starts-with" as const, v }
}
function $endsWith<A extends string>(v: A) {
  return { t: "ends-with" as const, v }
}

// todo: andWhere, orWhere

// function makeFilters<S>() {
//   return <O>(d: (f: WhereFilters2<S>) => O) => d(where as any)
// }

// type Filters<T extends [Filter<any, any, any, any>, ...Filter<any, any, any, any>[]]> = {
//   T: T
// }

// function build<S>() {
//   class Filters2<T extends [Filter<S, any, any, any>, ...Filter<S, any, any, any>[]]> {
//     readonly filters: T
//     constructor(...filters: T) {
//       this.filters = filters
//     }
//     where<T2 extends [Filter<S, any, any, any>, ...Filter<S, any, any, any>[]]>(t: T2) {
//       return new Filters2(...t, ...this.filters)
//     }
//   }
//   return Filters2
// }

// function build3<S>() {
//   class Filters3<T extends [...Filter<S, any, any, any>[]]> {
//     readonly filters: T
//     constructor(...filters: T) {
//       this.filters = filters
//     }
//     // filter(...t: [Filter<S, any, any, any>, ...Filter<S, any, any, any>[]]) {
//     //   return new Filters3(...t, ...this.filters)
//     // }

//     where: {
//       <A>(
//         path: (s: FocusInitial<S>) => FocusPrimitive<A>,
//         value: A
//       ): Filters3<[...T, Filter<S, string, "eq", A>]>
//       <A>(
//         path: (s: FocusInitial<S>) => FocusStructure<A>,
//         value: A
//       ): Filters3<[...T, Filter<S, string, "eq", A>]>
//       <A, Val extends ValueType<A>>(
//         path: (s: FocusInitial<S>) => FocusStructure<A>,
//         value: Val
//       ): Filters3<[...T, Filter<S, string, TType<Val>, VType<Val>>]>
//       <A, Val extends ValueType<A>>(
//         path: (s: FocusInitial<S>) => FocusPrimitive<A>,
//         value: Val
//       ): Filters3<[...T, Filter<S, string, TType<Val>, VType<Val>>]>
//     } = (path: any, val: any) => new Filters3(...this.filters, f(path, val) as any) as any
//   }
//   return Filters3
// }

type AFilters<A> = { is: typeof $is<A>; isnt: typeof $isnt<A>; in: typeof $in<readonly A[]>; notIn: typeof $notIn<readonly A[]> }
type StringFilters<A extends string> = { startsWith: typeof $startsWith<A>; endsWith: typeof $endsWith<A>; includes: typeof $includes<A> }
type StringType<A extends string> = { t: "starts-with" | "ends-with" | "includes"; v: A }
type ListFilters<A> = { contains: typeof $contains<A>; notContains: typeof $notContains<A> }
type ListType<A extends readonly any[]> = { t: "contains" | "not-contains"; v: A[number] }


// TODO: NumberAndDateFilters = { gt, gte, lt, lte }

function build4<S extends FieldValues>() {
  type Fil = Filter<S, string, any, any>

  type Paths = FieldPath<S>
  type Value<TFieldName extends Paths> = FieldPathValue<S, TFieldName>

  class Filters4 {
    readonly filters: readonly Fil[]
    constructor(readonly mode: "OR" | "AND", ...filters: readonly Fil[]) {
      this.filters = filters
    }
    // filter(...t: [Filter<S, any, any, any>, ...Filter<S, any, any, any>[]]) {
    //   return new Filters4(...t, ...this.filters)
    // }

    where: {
      // string path
      <TFieldName extends Paths, A extends Value<TFieldName>>(
        path: TFieldName,
        value: A
      ): Filters4

      <
        TFieldName extends Paths,
        A extends Value<TFieldName> & readonly A[],
        Val extends ListType<A>
      >(
        path: TFieldName,
        value: Val
      ): Filters4
      <
        TFieldName extends Paths,
        A extends Value<TFieldName> & string,
        Val extends StringType<A>
      >(
        path: TFieldName,
        value: Val
      ): Filters4

      // alt
      // <
      //   TFieldName extends Paths,
      //   A extends Value<TFieldName> & string,
      //   Val extends (ValueType<A> | StringType<A>)
      // >(
      //   path: TFieldName,
      //   value: (v: StringFilters<A> & AFilters<A>) => Val
      // ): Filters4
      <
        TFieldName extends Paths,
        A extends Value<TFieldName> & readonly A[],
        Val extends ListType<A>
      >(
        path: TFieldName,
        value: (v: ListFilters<A>) => Val
      ): Filters4
      <TFieldName extends Paths,
        A extends Value<TFieldName>,
        Val extends ValueType<A>
      >(
        path: TFieldName,
        value: (v: AFilters<A>) => Val
      ): Filters4



      // focus
      // <A, Val extends ValueType<A>
      // >(
      //   path: (s: FocusInitial<S>) => FocusPrimitive<A>,
      //   value: (v: AFilters<A>) => Val
      // ): Filters4
      // <A, Val extends ValueType<A>
      // >(
      //   path: (s: FocusInitial<S>) => FocusStructure<A>,
      //   value: (v: AFilters<A>) => Val
      // ): Filters4

      <A, Val extends ValueType<A>>(
        path: (s: FocusInitial<S>) => FocusPrimitive<A>,
        value: Val
        ): Filters4
        <A, Val extends ValueType<A>>(
          path: (s: FocusInitial<S>) => FocusStructure<A>,
          value: Val
        ): Filters4
      <A extends readonly any[], Val extends ListType<A>>(
        path: (s: FocusInitial<S>) => FocusPrimitive<A>,
        value: Val
      ): Filters4

      <A extends string, Val extends StringType<A>>(
        path: (s: FocusInitial<S>) => FocusPrimitive<A>,
        value: Val
      ): Filters4


      // alt
//       <
//       A extends string,
//       Val extends ValueType<A> | StringType<A>
//     >(
//       path: (s: FocusInitial<S>) => FocusPrimitive<A>,
//       value: (v: StringFilters<A> & AFilters<A>) => Val
//     ): Filters4
//   <
//   A extends string,
//   Val extends ValueType<A> | StringType<A>
// >(
//   path: (s: FocusInitial<S>) => FocusStructure<A>,
//   value: (v: StringFilters<A> & AFilters<A>) => Val
// ): Filters4

      // <
      // A,
      // Val extends ValueType<A>
      // >(
      //   path: (s: FocusInitial<S>) => FocusPrimitive<A>,
      //   value: (v: AFilters<A>) => Val
      //   ): Filters4
      //   <
      //     A,
      //     Val extends ValueType<A>
      //   >(
      //     path: (s: FocusInitial<S>) => FocusStructure<A>,
      //     value: (v: AFilters<A>) => Val
      //   ): Filters4
      //   <
      //     A extends readonly A[],
      //     Val extends ListType<A>
      //   >(
      //     path: (s: FocusInitial<S>) => FocusPrimitive<A>,
      //     value: (v: ListFilters<A>) => Val
      //   ): Filters4
      //   <
      //   A extends readonly A[],
      //   Val extends ListType<A>
      //   >(
      //     path: (s: FocusInitial<S>) => FocusStructure<A>,
      //     value: (v: ListFilters<A>) => Val
      //     ): Filters4




      <A>(
        path: (s: FocusInitial<S>) => FocusPrimitive<A>,
        value: A
      ): Filters4
      <A>(
        path: (s: FocusInitial<S>) => FocusStructure<A>,
        value: A
      ): Filters4
    } = (path: any, val: any) => new Filters4(this.mode, ...this.filters, f(path, val) as any) as any
  }
  return Filters4
}

export interface Subject2 {
  g: string
  h: readonly string[]
  i: number
}

export interface Subject {
  a: number
  b: { c: string }
  d: readonly string[]
  e: readonly ("a" | "b" | "c")[]
  f: readonly Subject2[]
}

const helpers = {
  startsWith: $startsWith,
  endsWith: $endsWith,
  contains: $contains,
  includes: $includes,
  is: $is,
  isnt: $isnt,
  in: $in,
  notInt: $notIn,
}

function f(a: any, b: any) {
  if (typeof b === "function") { b = b(helpers) }
  return makeFilter(a, typeof b === "object" ? b.v : b, b.t ?? "eq")
}

// const b = build<Subject>()
// new b([where((_: Subject) => _.b.c, $in(["something", "somethingElse"]))])
// const where = (k, v) => ({ key: k, ...v })

const b4 = build4<Subject>()
// const b33 = new b4("AND") // f(_ => _.b.c, $in(["something", "somethingElse"]))

function filterSubject(mode: "OR" | "AND" = "AND") {
  return new b4(mode)
}

// TODO: combining and/or

// console.log(
//   filterSubject()

//     .where("f.0.g", _ => _.includes("something"))
//     .where("f.0.g", _ => _.in(["abc"]))
//   // zoom
//     .where(_ => _.a, 1)
//     .where(_ => _.a, _ => _.is(2))
//     .where(_ => _.a, _ => _.isnt(3))
//     .where(_ => _.d, _ => _.contains("something"))
//     .where(_ => _.e, _ => _.contains("a" as const))
//     .where(_ => _.b.c, _ => _.in(["something", "somethingElse"]))
//     .where(_ => _.b.c, _ => _.startsWith("some"))
//     // .[number]. here is arbitrary, it just means: "I want to filter on elements of the array"
//     .where("f.0.g", $startsWith("some"))
//     .where("f.0.i", 2)
//     .where("f.0.h", $notContains("some"))
//   // .orderBy(_ => _.f)
//   // .skip(5)
//   // .take(5)
// )

console.log(
  filterSubject()
    .where("f.0.g", _ => _.includes("something"))
    .where("f.0.g", _ => _.in(["abc"]))
  // zoom
    .where("a", 1)
    .where("a", _ => _.is(2))
    .where("a", _ => _.isnt(3))
    .where("d", _ => _.contains("something"))
    .where("e", _ => _.contains("a" as const))
    .where("b.c", _ => _.in(["something", "somethingElse"]))
    .where("b.c", _ => _.startsWith("some"))
    // .[number]. here is arbitrary, it just means: "I want to filter on elements of the array"
    // .where("f.0.g", $startsWith("some"))
    // .where("f.0.i", 2)
    // .where("f.0.h", $notContains("some"))
  // .orderBy(_ => _.f)
  // .skip(5)
  // .take(5)
)

// const fil2 = <T extends [Filter<any, any, any, any>, ...Filter<any, any, any, any>[]]>(...f: T) => f

// const filters = makeFilters<Subject>()(where =>
//   fil2(
//     where(_ => _.b.c, $in(["something", "somethingElse"])),
//     where(_ => _.a, 1),
//     where(_ => _.b.c, $isnt("dude"))
//   )
// )

// diff with?
// const filters3 = makeFilters<Subject>()(_ => [
//   where(_ => _.b.c, $in(["something", "somethingElse"])),
//   where(_ => _.a, 1),
//   where(_ => _.b.c, $isnt("dude"))
// ])

// const filters = {
//   "b.c": $in(_ => _.b.c, "somethingElse")
// }
/*
  const filters = fil(
    where(_ => _.b.c, $in(["something", "somethingElse"])),
    where(_ => _.a, 1),
    where(_ => _.b.c, $isnt("dude")),
  )

  function fil<T extends [Filter<any, any, any>, ...Filter<any, any, any>[]]>(...f: T) {
    return f
  }
*/
