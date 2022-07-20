/*
Problems and thoughts:
- get should not write to eventlog, nor change state
  but we need to lock the `W` because of the variance of PureEnv in R.
  this is something that can be more easily solved via XPure.
  in S1 and out S2 also was smart that way as you could indicate you read, not write.

- get - do other PureProgram Ops - set, is dangerous, because you may set back an old state if you're not careful
  - GMU helpers help a bit with this, but it's still possible..
- maybe we can workaround the variance issue of PureEnv<W, S> by making 2 separate: PureState<S>, PureLog<W>
  then functions can depend on just what they need, and the env gets properly merged?
  The problem is if you want to read from the state (but not write).

*/
import { Chunk, Effect, Either, Sync, Tuple } from "@effect-ts-app/prelude"
import { SyncRef } from "./SyncRef.js"

/**
 * @tsplus type PureEnv
 */
export interface PureState<S> {
  readonly [Effect._S1]: () => S

  readonly state: SyncRef<S>
}

/**
 * @tsplus type PureEnv
 */
export interface PureLog<W> {
  readonly [Effect._W]: () => W
  readonly log: SyncRef<Chunk<W>>
}

/**
 * @tsplus type PureEnv
 */
export type PureEnv<W, S> = PureState<S> & PureLog<W>

class PureEnvBase<W, S> implements PureEnv<W, S> {
  readonly [Effect._W]!: () => W
  readonly [Effect._S1]!: () => S
  readonly state: SyncRef<S>
  readonly log: SyncRef<Chunk<W>>

  constructor(s: S) {
    this.state = SyncRef.make(s)
    this.log = SyncRef.make(Chunk.empty<W>())
  }
}

export function makePureEnv<W, S>(s: S): PureEnv<W, S> {
  return new PureEnvBase<W, S>(s)
}

/**
 * @tsplus unify PureEnv
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function unifyPureEnv<X extends PureEnv<any, any>>(
  self: X
): PureEnv<
  [X] extends [{ [Effect._W]: () => infer W }] ? W : never,
  [X] extends [{ [Effect._S1]: () => infer S }] ? S : never
> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return self
}

export type PureProgram<W, S, R, E, A> = Sync<PureEnv<W, S> & R, E, A>
type dsl<W,S> = DSL<W,S>

export namespace PureProgram {
  export type DSL<W,S> = dsl<W,S>

  // play with;
  // well a PureLogger may also want to access State, then it would be a combination of PureLogger & Reader, but not Writer?
  // actually a Logger may read from State..
  // export interface XReader<R, A> extends XPure<unknown, unknown, unknown, R, never, A> {}
  // export interface XIO<A> extends XPure<unknown, unknown, unknown, unknown, never, A> {}
  // export interface XState<S, A> extends XPure<unknown, S, S, unknown, never, A> {}
  // type State[S, +A] = zio.prelude.fx.ZPure[Nothing, S, S, Any, Nothing, A]
  // type Reader[-R, +A] = zio.prelude.fx.ZPure[Nothing, Unit, Unit, R, Nothing, A]
  // type Writer[+W, +A] = zio.prelude.fx.ZPure[W, Unit, Unit, Any, Nothing, A]
  // Unit(void?) for S, Nothing(never) for W+, Any(unknown) for -R

  export type Logger<W, A> = Sync<PureLog<W>, never, A>
  // export type PureReader<S, R, E, A> = Sync<R, E, A>
  // This is a problem then cause of missing S1 vs S2...
  // export type PureWriter<S, R, E, A> = Sync<PureState<S> & R, E, A>
  // this is why you need XPure
}

/**
 * @tsplus static PureProgram.Ops GMUA_
 */
export function GMUA_<W, S, GR, GE, GA, MR, ME, MA, UR, UE, UA>(
  get: PureProgram<W, S, GR, GE, GA>,
  modify: (i: GA) => PureProgram<W, S, MR, ME, Tuple<[GA, MA]>>,
  update: (i: GA) => PureProgram<W, S, UR, UE, UA>
): PureProgram<W, S, GR & MR & UR, GE | ME | UE, MA> {
  return get.flatMap(modify).flatMap(({ tuple: [s, a] }) => update(s).map(() => a))
}

/**
 * @tsplus static PureProgram.Ops GMUA
 */
export function GMUA<W, S, GA, MR, ME, MA>(modify: (i: GA) => PureProgram<W, S, MR, ME, Tuple<[GA, MA]>>) {
  return <GR, GE, UR, UE, UA>(
    get: PureProgram<W, S, GR, GE, GA>,
    update: (i: GA) => PureProgram<W, S, UR, UE, UA>
  ) => GMUA_(get, modify, update)
}

/**
 * @tsplus static PureProgram.Ops GMU_
 */

export function GMU_<W, S, GR, GE, GA, MR, ME, UR, UE, UA>(
  get: PureProgram<W, S, GR, GE, GA>,
  modify: (i: GA) => PureProgram<W, S, MR, ME, GA>,
  update: (i: GA) => PureProgram<W, S, UR, UE, UA>
): PureProgram<W, S, GR & MR & UR, GE | ME | UE, UA> {
  return get.flatMap(modify).flatMap(update)
}

/**
 * @tsplus static PureProgram.Ops GMU
 */
export function GMU<W, S, GA, MR, ME>(modify: (i: GA) => PureProgram<W, S, MR, ME, GA>) {
  return <GR, GE, UR, UE, UA>(
    get: PureProgram<W, S, GR, GE, GA>,
    update: (i: GA) => PureProgram<W, S, UR, UE, UA>
  ) => GMU_(get, modify, update)
}

/**
 * @tsplus static PureProgram.Ops modifyM
 */
export function modifyM<W, S, R, E>(mod: (s: S) => PureProgram<W, S, R, E, S>) {
  return GMU(mod)(get(), set)
}

/**
 * @tsplus static PureProgram.Ops modify
 */
export function modify<W, S>(mod: (s: S) => S): PureProgram<W, S, unknown, never, S> {
  return get<W, S>().map(mod).flatMap(set)
}

/**
 * @tsplus static PureProgram.Ops set
 */
export function set<W, S>(s: S): PureProgram<W, S, unknown, never, S> {
  return Sync.accessM((_: PureState<S>) => SyncRef.set_(_.state, s))
}

/**
 * @tsplus static PureProgram.Ops get
 */
export function get<W, S>(): PureProgram<W, S, unknown, never, S> {
  return Sync.accessM((_: PureState<S>) => SyncRef.get(_.state))
}

export function getMA<W, S, A>(self: (s: S) => A): PureProgram<W, S, unknown, never, A> {
  return Sync.accessM((_: PureState<S>) => SyncRef.get(_.state).map(self))
}

/**
 * @tsplus static PureProgram.Ops getM
 */
export function getM<W, S, R, E, A>(self: (s: S) => PureProgram<W, S, R, E, A>): PureProgram<W, S, R, E, A> {
  return Sync.accessM((_: PureState<S>) => SyncRef.get(_.state).flatMap(self))
}

// export function getTM__<W, S, R, E, A>(self: (s: S) => PureProgram<W, S, R, E, A>) {
//   return (tag: Has.Tag<PureEnv<W, S>>) => Sync.accessServiceM(tag)(_ => SyncRef.get(_.state).flatMap(self))
// }

// export function getTM_<W, S, R, E, A>(tag: Has.Tag<PureEnv<W, S>>, self: (s: S) => PureProgram<W, S, R, E, A>) {
//   return Sync.accessServiceM(tag)(_ => SyncRef.get(_.state).flatMap(self))
// }

// export function getTM<W, S, R, E, A>(tag: Has.Tag<PureEnv<W, S>>) {
//   const access = Sync.accessServiceM(tag)
//   return (self: (s: S) => PureProgram<W, S, R, E, A>) => access(_ => SyncRef.get(_.state).flatMap(self))
// }

/**
 * @tsplus type PureProgram.Ops
 */
export interface PureProgramOps {
  $: PureProgramAspects
}

/**
 * @tsplus type PureProgram.Aspects
 */

export interface PureProgramAspects {}
export const PureProgram: PureProgramOps = {
  $: {}
}

/**
 * @tsplus static PureProgram.Ops log
 */
export function log<W>(w: W): PureProgram.Logger<W, void> {
  return Sync.accessM((_: PureLog<W>) => SyncRef.modify_(_.log, l => l.append(w)))
}

/**
 * @tsplus static PureProgram.Ops makeDSL
 */
export function makeDSL<W, S>(): DSL<W, S> {
  return makeDSL_<W,S>()
}

function makeDSL_<W, S>() {
  // const tag = Has.tag<PureEnv<W, S>>()

  const get = Sync.accessM((_: PureState<S>) => SyncRef.get(_.state))
  function getM<R, E, A>(self: (s: S) => Sync<R, E, A>) { return get.flatMap(self) }
  function get_<A>(self: (s: S) => A) { return get.map(self)}
  function set(s: S) {
    return Sync.accessM((_: PureState<S>) => SyncRef.set_(_.state, s))
  }
  function log(w: W) {
    return PureProgram.log<W>(w)
  }
  function provide(s: S) {
    return Sync.provide(makePureEnv<W, S>(s))
  }

  const baseDSL = {
    get,
    log,
    set
  }

  function modify<A>(mod: (s: S) => Tuple<[S, A]>) {
    return Sync.accessM((_: PureState<S>) =>
      SyncRef.get(_.state).map(_ => mod(_)).flatMap(({ tuple: [s, a] }) => SyncRef.set_(_.state, s).map(() => a))
    )
  }

  function modifyM<R, E, A>(mod: (s: S) => Sync<R, E, Tuple<[S, A]>>) {
    // return accessM(_ => SyncRef.modifyM_(_.state, mod))
    return Sync.accessM((_: PureState<S>) =>
      SyncRef.get(_.state).flatMap(_ => mod(_)).flatMap(({ tuple: [s, a] }) => SyncRef.set_(_.state, s).map(() => a))
    )
  }

  function update(mod: (s: S) => S) {
    return modify(_ => Tuple.tuple(mod(_), void 0 as void))
  }

  function updateM<R, E>(mod: (s: S) => Sync<R, E, S>) {
    return modifyM(_ => mod(_).map(_ => Tuple.tuple(_, void 0 as void)))
  }

  const accessLog = Sync.accessM((_: PureEnv<W, S>) => SyncRef.get(_.log))

  function runAll<R, E, A>(
    self: Sync<R & PureEnv<W, S>, E, A>,
    s: S
  ): Sync<R, E, Tuple<[Chunk<W>, Either<E, Tuple<[S, A]>>]>> {
    return provide(s)(
      Sync.catchAll_(
        self.flatMap(x =>
          Sync.accessM((_: PureEnv<W, S>) =>
            Sync.struct({ log: SyncRef.get(_.log), state: SyncRef.get(_.state) })
//            SyncRef.get(_.log).flatMap(log => SyncRef.get(_.state).map(state => ({ log, state })))
          ).map(
            (
              { log, state }
            ) => Tuple.tuple(log, Either(Tuple.tuple(state, x)) as Either<E, Tuple<[S, A]>>)
          )
        ),
        err =>
          accessLog.map(log =>
            Tuple.tuple(log, Either.left(err) as Either<E, Tuple<[S, A]>>)
          )
      )
    )
  }

  function runResult<R, E, A>(
    self: Sync<R & PureEnv<W, S>, E, A>,
    s: S
  ): Sync<R, E, Tuple<[Chunk<W>, Either<E, S>]>> {
    return runAll(self, s).map(({ tuple: [log, r] }) => Tuple.tuple(log, r.map(({ tuple: [s] }) => s)))
  }

  function runA<R, E, A>(
    self: Sync<R & PureEnv<W, S>, E, A>,
    s: S
  ): Sync<R, E, Tuple<[Chunk<W>, Either<E, A>]>> {
    return runAll(self, s).map(({ tuple: [log, r] }) => Tuple.tuple(log, r.map(({ tuple: [, a] }) => a)))
  }

  return {
    ...baseDSL,

    getM,
    get_,
    accessLog,
    runAll,
    runA,
    runResult,

    modify,
    modifyM,
    update,
    updateM
  }
}

type dsl_<W,S> = ReturnType<typeof makeDSL_<W, S>>

/**
 * @tsplus type PureProgram/DSL
 */
export interface DSL<W, S> extends dsl_<W,S> { }
