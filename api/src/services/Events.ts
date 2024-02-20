import { storeId } from "@effect-app/infra/services/Store/Memory"
import { Effect, FiberRef, PubSub, Stream } from "effect-app"
import { TagClassMakeId } from "effect-app/service"
import type { NonEmptyReadonlyArray } from "effect/ReadonlyArray"
import type { ClientEvents } from "resources"

const makeEvents = Effect.gen(function*($) {
  const q = yield* $(PubSub.unbounded<{ evt: ClientEvents; namespace: string }>())
  const svc = {
    publish: (...evts: NonEmptyReadonlyArray<ClientEvents>) =>
      storeId.pipe(FiberRef.get).andThen((namespace) => q.offerAll(evts.map((evt) => ({ evt, namespace })))),
    subscribe: q.subscribe,
    stream: Stream.fromPubSub(q)
  }
  return svc
})

export abstract class Events extends TagClassMakeId("Events", makeEvents)<Events>() {
  static readonly Live = this.toLayer()
  static readonly publish = Effect.serviceFunctions(this).publish
}
