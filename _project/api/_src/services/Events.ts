import type { ClientEvents } from "@effect-app-boilerplate/resources"
import { storeId } from "@effect-app/infra/services/Store/Memory"
import { PubSub } from "effect"

const makeEvents = Effect.gen(function*($) {
  const q = yield* $(PubSub.unbounded<{ evt: ClientEvents; namespace: string }>())
  const svc = {
    publish: (...evts: NonEmptyReadonlyArray<ClientEvents>) =>
      storeId.get.flatMap((namespace) => q.offerAll(evts.map((evt) => ({ evt, namespace })))),
    subscribe: q.subscribe,
    stream: Stream.fromPubSub(q)
  }
  return svc
})

/**
 * @tsplus type Events
 * @tsplus companion Events.Ops
 */
export abstract class Events extends TagClassMake<Events>()(makeEvents) {
  static readonly Live = this.toLayer()
}
