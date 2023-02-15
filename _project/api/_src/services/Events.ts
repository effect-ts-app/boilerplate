import type { ClientEvents } from "@effect-app-boilerplate/resources"
import { storeId } from "@effect-app/infra/services/Store/Memory"
import type { Dequeue } from "@effect/io/Queue"

const makeEvents = Do($ => {
  const q = $(Hub.unbounded<{ evt: ClientEvents; namespace: string }>())
  const svc: Events = {
    publish: (...evts) => storeId.get.flatMap(namespace => q.offerAll(evts.map(evt => ({ evt, namespace })))),
    subscribe: q.subscribe()
  }
  return svc
})

/**
 * @tsplus type Events
 */
export interface Events {
  publish: (...events: NonEmptyReadonlyArray<ClientEvents>) => Effect<never, never, void>
  subscribe: Effect<Scope, never, Dequeue<{ evt: ClientEvents; namespace: string }>>
}

/**
 * @tsplus type Events.Ops
 */
export interface EventsOps extends Tag<Events> {}
export const Events: EventsOps = Tag<Events>()

/**
 * @tsplus static Events.Ops Live
 */
export const LiveEvents = makeEvents.toLayer(Events)
