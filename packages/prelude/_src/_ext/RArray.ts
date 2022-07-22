import { ImmutableArray } from "@effect-ts-app/core/Prelude"

/**
 * @tsplus fluent ets/Array groupByT
 */
export const groupByT_ = ImmutableArray.groupByT_

/**
 * @tsplus operator ets/Array &
 * @tsplus fluent ets/Array concat
 */
export function concat_<A, B>(
  self: ImmutableArray<A>,
  that: ImmutableArray<B>
): ImmutableArray<A | B> {
  return ImmutableArray.concat_(self, that)
}

/**
 * Concatenates two ets/Array together
 *
 * @tsplus operator ets/Array +
 */
export const concatOperator: <A>(
  self: ImmutableArray<A>,
  that: ImmutableArray<A>
) => ImmutableArray<A> = concat_

/**
 * Prepends `a` to ImmutableArray<A>
 *
 * @tsplus operator ets/Array + 1.0
 */
export function prependOperatorStrict<A>(a: A, self: ImmutableArray<A>): ImmutableArray<A> {
  return ImmutableArray.prepend_(self, a)
}

/**
 * Prepends `a` to ImmutableArray<A>
 *
 * @tsplus operator ets/Array >
 */
export function prependOperator<A, B>(a: A, self: ImmutableArray<B>): ImmutableArray<A | B> {
  return prepend_(self, a)
}

/**
 * Prepends `a` to ImmutableArray<A>
 *
 * @tsplus fluent ets/Array prepend
 */
export function prepend_<A, B>(tail: ImmutableArray<A>, head: B): ImmutableArray<A | B> {
  const len = tail.length
  const r = Array(len + 1)
  for (let i = 0; i < len; i++) {
    r[i + 1] = tail[i]
  }
  r[0] = head
  return r as unknown as ImmutableArray<A | B>
}

/**
 * Appends `a` to ImmutableArray<A>
 *
 * @tsplus fluent ets/Array append
 * @tsplus operator ets/Array <
 */
export function append_<A, B>(init: ImmutableArray<A>, end: B): ImmutableArray<A | B> {
  const len = init.length
  const r = Array(len + 1)
  for (let i = 0; i < len; i++) {
    r[i] = init[i]
  }
  r[len] = end
  return r as unknown as ImmutableArray<A | B>
}

/**
 * @tsplus operator ets/Array + 1.0
 */
export const appendOperator: <A>(self: ImmutableArray<A>, a: A) => ImmutableArray<A> = append_
