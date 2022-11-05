import type { OptimisticConcurrencyException } from "@/errors.js"
import { NotFoundError } from "@/errors.js"
import type { RequestContext } from "@effect-ts-app/boilerplate-infra/lib/RequestContext"
import type { Tuple } from "@effect-ts-app/boilerplate-prelude"
import type { FixEnv, PureLogT} from "@effect-ts-app/boilerplate-prelude/_ext/Pure";
import { isTuple } from "@effect-ts-app/boilerplate-prelude/utils"
import type { ContextMap } from "@effect-ts-app/boilerplate-infra/services/Store"

export interface Repository<T extends { id: Id }, Evt, Id extends string, ItemType extends string> {
  itemType: ItemType
  find: (id: Id) => Effect<ContextMap | RequestContext, never, Maybe<T>>
  all: Effect<ContextMap, never, Chunk<T>>
  save: (
    items: Collection<T>,
    events?: Collection<Evt>
  ) => Effect<ContextMap | RequestContext, OptimisticConcurrencyException, void>
}

/**
 * @tsplus fluent Repository get
 */
export function get<
  Id extends string,
  T extends { id: Id },
  Evt,
  ItemType extends string
>(
  self: Repository<T, Evt, Id, ItemType>,
  id: Id
) {
  return self.find(id).flatMap(_ => _.encaseInEffect(() => new NotFoundError(self.itemType, id)))
}

function updateOrAddWithEffectInt<
  Id extends string,
  T extends { id: Id },
  P extends T,
  Evt,
  ItemType extends string,
  R,
  E,
  A
>(
  self: Repository<T, Evt, Id, ItemType>,
  mod: (items: Chunk<T>) => Effect<R, E, readonly [Collection<P>, Collection<Evt>, A]>
) {
  return self.all.flatMap(_ => saveWithEffectInt(self, mod(_)))
}

function saveWithEffectInt<
  Id extends string,
  T extends { id: Id },
  P extends T,
  Evt,
  ItemType extends string,
  R,
  E,
  A
>(
  self: Repository<T, Evt, Id, ItemType>,
  gen: Effect<R, E, readonly [Collection<P>, Collection<Evt>, A]>
) {
  return gen
    .flatMap(
      ([items, events, a]) =>
        self.save(items, events)
          .map(() => a)
    )
}

function updateWithEffectInt<
  Id extends string,
  T extends { id: Id },
  P extends T,
  Evt,
  ItemType extends string,
  R,
  E,
  A
>(
  self: Repository<T, Evt, Id, ItemType>,
  id: Id,
  mod: (item: T) => Effect<R, E, readonly [P, Collection<Evt>, A]>
) {
  return get(self, id)
    .flatMap(mod)
    .flatMap(
      ([item, events, a]) =>
        self.save([item], events)
          .map(() => a)
    )
}

/**
 * @tsplus fluent Repository updateOrAddWithEffectFromPure
 */
export function updateOrAddWithEffectFromPure_<
  Id extends string,
  T extends { id: Id },
  R,
  E,
  Evt,
  ItemType extends string
>(
  self: Repository<T, Evt, Id, ItemType>,
  mod: (items: Chunk<T>) => Effect<R, E, Collection<readonly [T, readonly Evt[]]>>
) {
  return updateOrAddWithEffectInt(self, _ => mod(_).map(toTup))
}

/**
 * @tsplus fluent Repository updateWithEffect
 */
export function updateWithEffect<Id extends string, T extends { id: Id }, R, E, Evt, ItemType extends string>(
  self: Repository<T, Evt, Id, ItemType>,
  id: Id,
  mod: (item: T) => Effect<R, E, T | Tuple<[T, Collection<Evt>]>>
) {
  return updateWithEffectInt(self, id, _ =>
    mod(_)
      .map(_ => isTuple(_) ? tuple(_.tuple[0], _.tuple[1], _.tuple[0]) : tuple(_, [], _)))
}

/**
 * @tsplus fluent Repository updateWithPure
 */
export function updateWithPure<
  Id extends string,
  R,
  T extends { id: Id },
  A,
  E,
  Evt,
  S2 extends T,
  ItemType extends string
>(
  self: Repository<T, Evt, Id, ItemType>,
  id: Id,
  mod: Effect<FixEnv<R, Evt, T, S2>, E, A>
) {
  return updateWithEffectInt(self, id, _ => mod.runTerm(_))
}

export interface DSL<S, S2, W> {
  get: ReturnType<typeof Pure.get<S>>, set: typeof Pure.set<S2>, log: typeof Pure.log<W>
}

const dsl: DSL<any, any, any> = { get: Pure.get(), set: Pure.set, log: Pure.log }

/**
 * @tsplus fluent Repository updateOrAddWithPure
 */
export function updateOrAddWithPure<
  Id extends string,
  R,
  T extends { id: Id },
  A,
  E,
  Evt,
  S2 extends T,
  ItemType extends string
>(
  self: Repository<T, Evt, Id, ItemType>,
  mod: (items: Chunk<T>, _: DSL<Chunk<T>, Collection<S2>, Evt>) => Effect<FixEnv<R, Evt, Chunk<T>, Collection<S2>>, E, A>
) {
  return self.all
    .flatMap(saveWithPure<Id, R, T, A, E, Evt, T, S2, ItemType>(self, mod))
}

/**
 * @tsplus fluent Repository saveWithPure
 */
export function saveWithPure<
  Id extends string,
  R,
  T extends { id: Id },
  A,
  E,
  Evt,
  S1 extends T,
  S2 extends T,
  ItemType extends string
>(
  self: Repository<T, Evt, Id, ItemType>,
  mod: (items: Chunk<S1>, _: DSL<Chunk<S1>, Collection<S2>, Evt>) => Effect<FixEnv<R, Evt, Chunk<S1>, Collection<S2>>, E, A>
) {
  return (items: Collection<S1>) => dsl.get.flatMap(items => mod(items, dsl)).runTerm(items.toChunk)
    .flatMap(
      ([items, events, a]) =>
        self.save(items, events)
          .map(() => a)
    )
}

/**
 * @tsplus fluent Repository saveWithPure_
 */
export function saveWithPure_<
  Id extends string,
  R,
  T extends { id: Id },
  A,
  E,
  Evt,
  S1 extends T,
  S2 extends T,
  ItemType extends string
>(
  self: Repository<T, Evt, Id, ItemType>,
  items: Collection<S1>,
  mod: (items: Chunk<S1>, _: DSL<Chunk<S1>, Collection<S2>, Evt>) => Effect<FixEnv<R, Evt, Chunk<S1>, Collection<S2>>, E, A>
) {
  return dsl.get.flatMap(items => mod(items, dsl)).runTerm(items.toChunk)
    .flatMap(
      ([items, events, a]) =>
        self.save(items, events)
          .map(() => a)
    )
}

/**
 * @tsplus fluent Repository updateOrAddPureWith
 */
export function updateOrAddPureWith<
  Id extends string,
  T extends { id: Id },
  Evt,
  S2 extends T,
  ItemType extends string
>(
  self: Repository<T, Evt, Id, ItemType>,
  mod: (items: Chunk<T>) => Collection<S2>
) {
  return updateOrAddWithEffectInt(self, items => Pure.updateWith(mod).runTerm(items))
}

/**
 * @tsplus fluent Repository updateOrAddPureWithEffect
 */
export function updateOrAddPureWithEffect<
  Id extends string,
  R,
  T extends { id: Id },
  E,
  Evt,
  S2 extends T,
  Ret extends Collection<S2>,
  ItemType extends string
>(
  self: Repository<T, Evt, Id, ItemType>,
  mod: (
    items: Chunk<T>,
    log: (evt: Evt) => PureLogT<Evt>
  ) => Effect<FixEnv<R, Evt, Chunk<T>, Ret>, E, Ret>
) {
  return updateOrAddWithEffectInt(self, items => Pure.updateWithEffect(mod).runTerm(items))
}

/**
 * @tsplus getter Repository log
 */
export function log<
  Id extends string,
  T extends { id: Id },
  Evt,
  ItemType extends string
>(
  _: Repository<T, Evt, Id, ItemType>,
) {
  return (evt: Evt) => dsl.log(evt)
}

/**
 * @tsplus fluent Repository logIf
 */
export function logIf<Id extends string, T extends { id: Id }, S1 extends T,   Evt,
  ItemType extends string
>(self: Repository<T, Evt, Id, ItemType>, fnc: (items: NonEmptyArray<S1>) => Evt) {
  return (items: Collection<S1>) => logIf_(self, items, fnc)
}

/**
 * @tsplus fluent Repository logIf_
 */
export function logIf_<Id extends string, T extends { id: Id }, S1 extends T,   Evt,
  ItemType extends string
>(self: Repository<T, Evt, Id, ItemType>, items: Collection<S1>, fnc: (items: NonEmptyArray<S1>) => Evt) {
  return Effect(items.toNonEmptyArray).tapMaybe(_ => log(self)(fnc(_))).unit
}

/**
 * @tsplus fluent Repository logAllIf
 */
export function logAllIf<Id extends string, T extends { id: Id }, S1 extends T,   Evt,
  ItemType extends string
>(self: Repository<T, Evt, Id, ItemType>, fnc: (items: NonEmptyArray<S1>) => NonEmptyArray<Evt>) {
  return (items: Collection<S1>) => Effect(items.toNonEmptyArray).tapMaybe(_ => fnc(_).forEachEffect(log(self))).unit
}
    
/**
 * @tsplus fluent Repository logAllIf_
 */
export function logAllIf_<Id extends string, T extends { id: Id }, S1 extends T,   Evt,
  ItemType extends string
>(self: Repository<T, Evt, Id, ItemType>, items: Collection<S1>, fnc: (items: NonEmptyArray<S1>) => NonEmptyArray<Evt>) {
  return Effect(items.toNonEmptyArray).tapMaybe(_ => fnc(_).forEachEffect(log(self))).unit
}

/**
 * @tsplus fluent Repository savePureWithEffect
 */
export function savePureWithEffect<
  Id extends string,
  R,
  T extends { id: Id },
  E,
  Evt,
  S1 extends T,
  S2 extends T,
  ItemType extends string
>(
  self: Repository<T, Evt, Id, ItemType>,
  mod: (
    items: Chunk<S1>,
    log: (evt: Evt) => PureLogT<Evt>
  ) => Effect<FixEnv<R, Evt, Chunk<S1>, Collection<S2>>, E, Collection<S2>>
) {
  return (
    items: Collection<S1>,
  ) => saveWithEffectInt(self, Pure.updateWithEffect(mod).runTerm(items.toChunk))
}

/**
 * @tsplus fluent Repository updatePureWith
 */
export function updatePureWith<
  Id extends string,
  T extends { id: Id },
  Evt,
  S2 extends T,
  ItemType extends string
>(
  self: Repository<T, Evt, Id, ItemType>,
  id: Id,
  mod: (item: T) => S2
) {
  return updateWithEffectInt(self, id, item => Pure.updateWith(mod).runTerm(item))
}

/**
 * @tsplus fluent Repository updatePureWithEffect
 */
export function updatePureWithEffect<
  Id extends string,
  R,
  T extends { id: Id },
  E,
  Evt,
  S2 extends T,
  ItemType extends string
>(
  self: Repository<T, Evt, Id, ItemType>,
  id: Id,
  mod: (item: T, log: (evt: Evt) => PureLogT<Evt>) => Effect<FixEnv<R, Evt, T, S2>, E, S2>
) {
  return updateWithEffectInt(self, id, item => Pure.updateWithEffect(mod).runTerm(item))
}

// /**
//  * @tsplus getter Repository log
//  */
// export function log<Id extends string, T extends { id: Id }, Evt, ItemType extends string>(
//   _: Repository<T, Evt, Id, ItemType>
// ) {
//   return (evt: Evt) => Pure.log(evt)
// }

/**
//  * @tsplus fluent Repository update
//  */
// export function update<Id extends string, T extends { id: Id }, Evt>(
//   self: Repository<T, Evt>,
//   id: Id,
//   mod: (item: T) => T | Tuple<[T, Collection<Evt>]>
// ) {
//   return updateWithEffect(self, id, _ => Effect(mod(_)))
// }

// /**
//  * @tsplus fluent Repository updateOrAdd
//  */
// export function updateOrAdd<Id extends string, T extends { id: Id }, Evt>(
//   self: Repository<T, Evt>,
//   mod: (items: Chunk<T>) => Collection<T> | Tuple<[Collection<T>, Collection<Evt>]>
// ) {
//   return updateOrAddWithEffect_(self, _ => Effect(mod(_)))
// }

function toTup<T, Evt>(r: Collection<readonly [T, readonly Evt[]]>) {
  const items = r.map(_ => _[0])
  return tuple(items, r.map(_ => _[1]).toArray.flatten(), items)
}
