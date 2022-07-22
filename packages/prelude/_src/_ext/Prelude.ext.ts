import "@effect-ts-app/core/_ext/Prelude.ext"

import { Effect, Either, Sync, type SyncMaybe, type XPure } from "@effect-ts-app/core/Prelude"
import "./Chunk.ext.js"
import "./Either.ext.js"
import "./Has.ext.js"
import "./Layer.ext.js"
import "./Lens.ext.js"
import "./Prelude/XPure.js"
import "./Schema.ext.js"

/**
 * @tsplus fluent ets/Effect pipe
 * @tsplus fluent ets/Managed pipe
 * @tsplus fluent ets/Sync pipe
 * @tsplus macro pipe
 */
export const pipeEffect = pipe

/**
 * @tsplus fluent ets/Sync zipRightS
 * @deprecated fix by replacing legacy effect-ts/fluent, and dropping 'S' suffix
 */
export const syncZipRight = <RX, EX, AX, R2, E2, B>(
  self: Sync<RX, EX, AX>,
  f: Sync<R2, E2, B>
): Sync<RX & R2, EX | E2, B> => {
  return self.flatMap(_ => f)
}

/**
 * @tsplus fluent ets/Sync tapS
 * @deprecated fix by replacing legacy effect-ts/fluent, and dropping 'S' suffix
 */
export const syncTap = <RX, EX, AX, R2, E2, B>(
  self: Sync<RX, EX, AX>,
  f: (a: AX) => Sync<R2, E2, B>
): Sync<RX & R2, EX | E2, AX> => {
  return self.flatMap(_ => f(_).map(() => _))
}

/**
 * @tsplus getter ets/Sync asEffect
 */
export const toEffect = Sync.toEffect

/**
 * @tsplus fluent ets/Either fold
 */
export const eitherFold = Either.fold_

/**
 * @tsplus fluent ets/Effect injectSomeFIX
 */
export const effectInjectSome = Effect.provide_

/**
 * @tsplus fluent ets/Sync getOrFailM
 */
export function getOrFailM<R, R2, E, E2, E3, A>(
  self: SyncMaybe<R, E, A>,
  onNone: () => Sync<R2, E3, E2>
): Sync<R & R2, E | E2 | E3, A> {
  return self.flatMap(_ => _.fold(() => onNone().flatMap(Sync.fail), Sync.succeed))
}

// // NOTE: unify functions only work if the @tsplus type tag is on the original definition, not on prelude's definitions.
/**
 * @tsplus unify ets/XPure
 */
export function unifyXPure<X extends XPure<any, any, any, any, any, any>>(
  self: X
): XPure<
  [X] extends [{ [Effect._W]: () => infer W }] ? W : never,
  [X] extends [{ [Effect._S1]: (_: infer S1) => void }] ? S1 : never,
  [X] extends [{ [Effect._S2]: () => infer S2 }] ? S2 : never,
  [X] extends [{ [Effect._R]: (_: infer R) => void }] ? R : never,
  [X] extends [{ [Effect._E]: () => infer E }] ? E : never,
  [X] extends [{ [Effect._A]: () => infer A }] ? A : never
> {
  return self
}
