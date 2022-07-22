import type { Either, Maybe } from "@effect-ts-app/core/Prelude"
import * as P from "@effect-ts/core/Prelude"
import type { XPure as XPureOrig } from "@effect-ts/core/XPure"
import * as XP from "@effect-ts/core/XPure"
import type { LazyArg } from "../lazyArg.js"
/**
 * @tsplus type ets/XPure
 */
export type XPure<W, S1, S2, R, E, A> = XPureOrig<W, S1, S2, R, E, A>

/**
 * @tsplus type ets/XPure.Ops
 */
export interface XPureOps {
  $: XPureAspects
}
export const XPure: XPureOps = {
  $: {}
}

/**
 * @tsplus static ets/XPure.Ops __call
 */
export const xpureSucceed: <S, A>(
  a: LazyArg<A>
) => XPure<never, S, S, unknown, never, A> = XP.succeedWith as any

/**
 * @tsplus type ets/XPure.Aspects
 */
export interface XPureAspects {}

// export namespace Effect {
//   export type UIO<A> = Effect<unknown, never, A>;
//   export type IO<E, A> = Effect<unknown, E, A>;
//   export type RIO<R, A> = Effect<R, never, A>;
//   export interface Error<E, A> {
//     readonly _tag: "EffectError";
//     readonly exit: Exit<E, A>;
//     readonly trace?: string;
//   }
// }

/**
 * @tsplus static ets/XPure.Ops run
 */
export const run = XP.run

/**
 * @tsplus static ets/XPure.Ops runResult
 */
export const runResult = XP.runResult

/**
 * @tsplus static ets/XPure.Ops encaseOption
 */
export const encaseOption = <S1, S2 = S1>() =>
  <E, A>(opt: Maybe<A>, e: () => E): XPure<never, S1, S2, unknown, E, A> =>
    opt.fold(() => XP.fail(e()), XP.succeed) as any

/**
 * @tsplus static ets/XPure.Ops encaseEither
 */
export const encaseEither = <S1, S2 = S1>() =>
  <E, A>(ei: Either<E, A>): XPure<never, S1, S2, unknown, E, A> => ei.fold(XP.fail, XP.succeed) as any

/**
 * @tsplus fluent ets/XPure runResult
 */
export const runResult_ = XP.runResult_

/**
 * @tsplus static ets/XPure.Ops runState
 */
export const runState = XP.runState

/**
 * @tsplus fluent ets/XPure runState
 */
export const runState_ = XP.runState_

/**
 * @tsplus static ets/XPure.Aspects map
 */
export const map = XP.map

/**
 * @tsplus static ets/XPure.Aspects mapError
 */
export const mapError = XP.mapError

/**
 * @tsplus static ets/XPure.Aspects flatMap
 */
export const flatMap = XP.chain

/**
 * @tsplus static ets/XPure.Aspects tap
 */
export const tap = XP.tap

/**
 * @tsplus static ets/XPure.Aspects runAll
 */
export const runAll = XP.runAll

/**
 * @tsplus static ets/XPure.Aspects provide
 */
export const provide = XP.provide

/**
 * @tsplus fluent ets/XPure map
 */
export const map_ = XP.map_

/**
 * @tsplus fluent ets/XPure flatMap
 */
export const flatMap_ = XP.chain_

/**
 * @tsplus fluent ets/XPure mapError
 */
export const mapError_ = XP.mapError_

/**
 * @tsplus fluent ets/XPure tap
 */
export const tap_ = XP.tap_

/**
 * @tsplus fluent ets/XPure runAll
 */
export const runAll_ = XP.runAll_

/**
 * @tsplus fluent ets/XPure runEither
 */
export const runEither = XP.runEither

/**
 * @tsplus fluent ets/XPure provide
 */
export const provide_ = XP.provideAll_

/**
 * @tsplus fluent ets/XPure log
 */
export function log_<W, S1, S2, R, E, A, W2>(self: XPure<W, S1, S2, R, E, A>, w: W2) {
  return self.tap(() => XP.log(w))
}

/**
 * @tsplus static ets/XPure.Ops gen
 */
export const gen = P.genF(XP.Monad)

// /**
//  * @tsplus fluent ets/XPure getM
//  */
// export function getM<W, S1, S2, R, E, A, R2, E2, A2>(
//   self: XPure<W, S1, S2, R, E, A>,
//   f: (s1: S1) => XPure<W, S1, unknown, R2, E2, A2>
// ) {
//   return XP.update(self)(s1 => f(s1).map(() => s1))
// }

// /**
//  * @tsplus fluent ets/XPure zipRight
//  */
// export const zipRight = XP.zipRight_

// /**
//  * @tsplus fluent ets/XPure log
//  */
// export const log = XP.log_

// /**
//  * @tsplus fluent ets/XPure set
//  */
// export const set = XP.set_

// /**
//  * @tsplus fluent ets/XPure update
//  */
// export const update = XP.update_

/**
 * @tsplus static ets/XPure.Ops get
 */
export const get = XP.get

/**
 * @tsplus static ets/XPure.Ops getM
 */
export const getM = XP.getM

/**
 * @tsplus static ets/XPure.Ops modify
 */
export const modify = XP.modify

/**
 * @tsplus static ets/XPure.Ops set
 */
export const set = XP.set

/**
 * @tsplus static ets/XPure.Ops access
 */
export const access = XP.access

/**
 * @tsplus static ets/XPure.Ops update
 */
export const update = XP.update

/**
 * @tsplus static ets/XPure.Ops succeed
 */
export const succeed = XP.succeed

/**
 * @tsplus static ets/XPure.Ops fail
 */
export const fail = XP.fail

/**
 * @tsplus static ets/XPure.Ops log
 */
export const log = XP.log

/**
 * @tsplus static ets/XPure.Ops struct
 */
export const struct = XP.struct

/**
 * @tsplus static ets/XPure.Ops tuple
 */
export const tuple = XP.tuple

/**
 * @tsplus static ets/XPure.Ops match
 */
export const match = XP.match

export * from "@effect-ts/core/XPure"
