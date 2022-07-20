import { Effect, Sync } from "@effect-ts-app/prelude"

export interface SyncRef<A> {
  readonly [Effect._A]: () => A
}

export class SyncRefBase<A> implements SyncRef<A> {
  readonly [Effect._A]!: () => A
  readonly set = (a: A) => Sync.succeedWith(() => this.value = a)
  readonly get = Sync.succeedWith(() => this.value)
  constructor(private value: A) {}
}
/**
 * @tsplus macro remove
 */
export function concreteSyncRef<A>(
  _: SyncRef<A>
): asserts _ is SyncRefBase<A> {
  //
}

/**
 * @tsplus macro identity
 */
export function concreteSyncRefId<A>(
  _: SyncRef<A>
): SyncRefBase<A> {
  concreteSyncRef(_)
  return _
}

export const SyncRef = {
  make: <A>(a: A): SyncRef<A> => new SyncRefBase(a),
  set_: <A>(ref: SyncRef<A>, a: A) => concreteSyncRefId(ref).set(a),
  set: <A>(a: A) => (ref: SyncRef<A>) => SyncRef.set_(ref, a),
  get: <A>(ref: SyncRef<A>) => concreteSyncRefId(ref).get,
  modify_: <A>(ref: SyncRef<A>, mod: (a: A) => A) => SyncRef.modifyM_(ref, v => Sync.succeedWith(() => mod(v))),
  modifyM_: <R, E, A>(ref: SyncRef<A>, mod: (a: A) => Sync<R, E, A>) => {
    const r = concreteSyncRefId(ref)
    return r.get.flatMap(mod).flatMap(_ => r.set(_).map(() => _))
  }
}
