import { storeId } from "@effect-app/infra/Store/Memory"
import { Effect, FiberRef, PubSub, Stream } from "effect-app"
import type { NonEmptyReadonlyArray } from "effect/Array"
import type { ClientEvents } from "resources.js"

export class Events extends Effect.Service<Events>()("Events", {
  accessors: true,
  scoped: Effect.gen(function*() {
    const q = yield* PubSub.unbounded<{ evt: ClientEvents; namespace: string }>()
    // we would prefer the http server interrupting the stream processing as part of its shutdown
    // but that's not happening, and this is the next best thing
    yield* Effect.addFinalizer(() => q.shutdown)
    const svc = {
      publish: (...evts: NonEmptyReadonlyArray<ClientEvents>) =>
        storeId.pipe(FiberRef.get, Effect.andThen((namespace) => q.offerAll(evts.map((evt) => ({ evt, namespace }))))),
      subscribe: q.subscribe,
      stream: Stream.fromPubSub(q, { scoped: true })
    }
    return svc
  })
}) {}
