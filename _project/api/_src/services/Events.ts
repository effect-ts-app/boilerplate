import type { ClientEvents } from "@effect-app-boilerplate/resources"
import { storeId } from "@effect-app/infra/services/Store/Memory"

const makeEvents = Effect.gen(function*($) {
  const q = yield* $(PubSub.unbounded<{ evt: ClientEvents; namespace: string }>())
  const svc: Events = {
    publish: (...evts) => storeId.get.flatMap((namespace) => q.offerAll(evts.map((evt) => ({ evt, namespace })))),
    subscribe: q.subscribe,
    stream: Stream.fromPubSub(q)
  }
  return svc
})

/**
 * @tsplus type Events
 * @tsplus companion Events.Ops
 */
export abstract class Events extends TagClass<Events>() {
  abstract publish: (...events: NonEmptyReadonlyArray<ClientEvents>) => Effect<never, never, void>
  abstract subscribe: Effect<Scope, never, Dequeue<{ evt: ClientEvents; namespace: string }>>
  abstract stream: Stream<never, never, { evt: ClientEvents; namespace: string }>
}

/**
 * @tsplus static Events.Ops Live
 */
export const LiveEvents = makeEvents.toLayer(Events)
