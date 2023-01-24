import type { ClientEvents } from "@effect-app-boilerplate/client"
import type { Dequeue } from "@effect/io/Queue"

const makeEvents = Do($ => {
  const q = $(Hub.unbounded<Evt>())
  const svc: Events = {
    publish: (...events: NonEmptyReadonlyArray<Evt>) => q.offerAll(events),
    subscribe: q.subscribe()
  }
  return svc
})

/**
 * @tsplus type Events
 */
export interface Events {
  publish: (...evt: NonEmptyReadonlyArray<Evt>) => Effect<never, never, void>
  subscribe: Effect<Scope, never, Dequeue<Evt>>
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

type Evt = ClientEvents
