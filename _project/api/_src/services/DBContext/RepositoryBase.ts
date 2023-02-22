import type { InvalidStateError, OptimisticConcurrencyException } from "@/errors.js"
import type { RequestContext } from "@effect-app/infra/RequestContext"
import type { Repository } from "@effect-app/infra/services/Repository"
import type { ContextMap, Filter } from "@effect-app/infra/services/Store"
import type { ParserEnv } from "@effect-app/schema/custom/Parser"

import type {} from "@effect/data/Equal"
import type {} from "@effect/data/Hash"

export const RepositoryBase = <Service>() => {
  return <T extends { id: Id }, PM extends { id: string }, Evt, Id extends string, ItemType extends string>(
    itemType: ItemType
  ) => {
    abstract class RepositoryBaseC implements Repository<T, PM, Evt, Id, ItemType> {
      itemType: ItemType = itemType
      abstract find: (id: Id) => Effect<ContextMap | RequestContext, never, Opt<T>>
      abstract all: Effect<ContextMap, never, Chunk<T>>
      abstract saveAndPublish: (
        items: Iterable<T>,
        events?: Iterable<Evt>
      ) => Effect<ContextMap | RequestContext, InvalidStateError | OptimisticConcurrencyException, void>
      abstract utils: {
        mapReverse: (
          pm: PM,
          setEtag: (id: string, eTag: string | undefined) => void
        ) => unknown // TODO
        parse: (a: unknown, env?: ParserEnv | undefined) => T
        all: Effect<never, never, Chunk<PM>>
        filter: (filter: Filter<PM>, cursor?: { limit?: number; skip?: number }) => Effect<never, never, Chunk<PM>>
      }
    }
    return assignTag<Tag<Service>>()(RepositoryBaseC)
  }
}
