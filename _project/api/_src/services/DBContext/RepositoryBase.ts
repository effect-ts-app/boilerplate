import type { RequestContext } from "@effect-app/infra/RequestContext"
import type { Repository } from "@effect-app/infra/services/Repository"
import { ContextMap, StoreMaker } from "@effect-app/infra/services/Store"
import type { Filter, Store, Where } from "@effect-app/infra/services/Store"
import type { ParserEnv } from "@effect-app/schema/custom/Parser"
import type { InvalidStateError, OptimisticConcurrencyException } from "api/errors.js"
import type {} from "@effect/data/Equal"
import type {} from "@effect/data/Hash"
import { Effect } from "@effect-app/core/Effect"
import type { Opt } from "@effect-app/core/Option"
import { makeCodec } from "@effect-app/infra/api/codec"
import { makeFilters } from "@effect-app/infra/filter"
import type { Chunk, Schema } from "@effect-app/prelude"
import { EParserFor } from "@effect-app/prelude/schema"
import { assignTag } from "@effect-app/prelude/service"

export const RepositoryBase = <Service>() => {
  return <T extends { id: string }, PM extends { id: string; _etag: string | undefined }, Evt, ItemType extends string>(
    itemType: ItemType
  ) => {
    abstract class RepositoryBaseC implements Repository<T, PM, Evt, ItemType> {
      itemType: ItemType = itemType
      abstract find: (id: T["id"]) => Effect<ContextMap | RequestContext, never, Opt<T>>
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
      static where = makeWhere<PM>()
    }
    return assignTag<Service>()(RepositoryBaseC)
  }
}

export function makeRepo<
  T extends { id: string },
  PM extends { id: string; _etag: string | undefined },
  Evt = never
>() {
  return <
    ItemType extends string,
    ConstructorInput,
    Api,
    E extends { id: string }
  >(
    name: ItemType,
    schema: Schema.Schema<unknown, T, ConstructorInput, E, Api>,
    mapFrom: (pm: Omit<PM, "_etag">) => E,
    mapTo: (e: E, etag: string | undefined) => PM
  ) => {
    const where = makeWhere<PM>()

    function mapToPersistenceModel(
      e: E,
      getEtag: (id: string) => string | undefined
    ): PM {
      return mapTo(e, getEtag(e.id))
    }

    function mapReverse(
      { _etag, ...e }: PM,
      setEtag: (id: string, eTag: string | undefined) => void
    ): E {
      setEtag(e.id, _etag)
      return mapFrom(e)
    }

    const mkStore = makeStore<PM>()(name, schema, mapTo)

    function make(
      makeInitial: Effect<never, never, never[] | readonly [T, ...T[]]>,
      publishEvents: (evt: Iterable<Evt>) => Effect<never, never, void>,
      partitionValue: (a: PM) => string = _ => "primary" /*(isIntegrationEvent(r) ? r.companyId : r.id*/
    ) {
      return Do($ => {
        const store = $(mkStore(makeInitial, partitionValue))

        const allE = store.all.flatMap(items =>
          Do($ => {
            const { set } = $(ContextMap.access)
            return items.map(_ => mapReverse(_, set))
          })
        )

        const all = allE.flatMap(_ => _.forEachEffect(EParserFor(schema).condemnDie))

        function findE(id: T["id"]) {
          return store.find(id)
            .flatMap(items =>
              Do($ => {
                const { set } = $(ContextMap.access)
                return items.map(_ => mapReverse(_, set))
              })
            )
        }

        function find(id: T["id"]) {
          return findE(id).flatMapOpt(EParserFor(schema).condemnDie)
        }

        const saveAllE = (a: Iterable<E>) =>
          Effect(a.toNonEmptyArray)
            .flatMapOpt(a =>
              Do($ => {
                const { get, set } = $(ContextMap.access)
                const items = a.mapNonEmpty(_ => mapToPersistenceModel(_, get))
                const ret = $(store.batchSet(items))
                ret.forEach(_ => set(_.id, _._etag))
              })
            )

        const saveAll = (a: Iterable<T>) => saveAllE(a.toChunk.map(Encoder.for(schema)))

        const saveAndPublish = (items: Iterable<T>, _: Iterable<Evt> = []) =>
          saveAll(items)
            > publishEvents(_)

        const r: Repository<T, PM, Evt, ItemType> = {
          /**
           * @internal
           */
          utils: { mapReverse, parse: Parser.for(schema).unsafe, filter: store.filter, all: store.all },
          itemType: name,
          find,
          all,
          saveAndPublish
        }
        return r
      })
    }

    return {
      make,
      where
    }
  }
}

export function makeWhere<PM extends { id: string; _etag: string | undefined }>() {
  const f_ = makeFilters<PM>()
  type WhereFilter = typeof f_

  function makeFilter_(filter: (f: WhereFilter) => Filter<PM>) {
    return filter(f_)
  }

  function where(
    makeWhere: (
      f: WhereFilter
    ) => Where | readonly [Where, ...Where[]],
    mode?: "or" | "and"
  ) {
    return makeFilter_(f => {
      const m = makeWhere ? makeWhere(f) : []
      return ({
        mode,
        where: (Array.isArray(m) ? m as unknown as [Where, ...Where[]] : [m]) as readonly [Where, ...Where[]]
      })
    })
  }
  return where
}

const pluralize = (s: string) =>
  s.endsWith("s")
    ? s + "es"
    : s.endsWith("y")
    ? s.substring(0, s.length - 1) + "ies"
    : s + "s"

export function makeStore<
  PM extends { id: string; _etag: string | undefined }
>() {
  return <
    ItemType extends string,
    T extends { id: string },
    ConstructorInput,
    Api,
    E extends { id: string }
  >(
    name: ItemType,
    schema: Schema.Schema<unknown, T, ConstructorInput, E, Api>,
    mapTo: (e: E, etag: string | undefined) => PM
  ) => {
    const [_dec, _encode, encodeToMap] = makeCodec(schema)
    const encodeToMapPM = flow(
      encodeToMap,
      _ =>
        _.flatMap(map =>
          Effect.gen(function*($) {
            const { get } = yield* $(ContextMap.access)
            return new Map(
              [...map.entries()].map(([k, v]) => [k, mapToPersistenceModel(v, get)])
            )
          })
        )
    )

    function mapToPersistenceModel(
      e: E,
      getEtag: (id: string) => string | undefined
    ): PM {
      return mapTo(e, getEtag(e.id))
    }

    function makeStore(
      makeInitial: Effect<never, never, never[] | readonly [T, ...T[]]>,
      partitionValue: (a: PM) => string = _ => "primary" /*(isIntegrationEvent(r) ? r.companyId : r.id*/
    ) {
      return Do($ => {
        const { make } = $(StoreMaker.access)

        const store = $(
          make<PM, string, T["id"]>(
            pluralize(name),
            makeInitial.flatMap(encodeToMapPM).setupNamedRequest("initial"),
            {
              partitionValue
            }
          )
        )
        return store
      })
    }

    return makeStore
  }
}

export const RepositoryBaseImpl = <Service>() => {
  return <
    PM extends { id: string; _etag: string | undefined },
    Evt = never
  >() =>
  <ItemType extends string, T extends { id: string }, ConstructorInput, Api, E extends { id: string }>(
    itemType: ItemType,
    schema: Schema.Schema<unknown, T, ConstructorInput, E, Api>,
    mapFrom: (pm: Omit<PM, "_etag">) => E,
    mapTo: (e: E, etag: string | undefined) => PM
  ): Tag<Service> & {
    new(
      store: Store<PM, string>,
      publishEvents: (evt: Iterable<Evt>) => Effect<RequestContext, never, void>
    ): Repository<T, PM, Evt, ItemType>
    makeStore: (
      makeInitial: Effect<never, never, never[] | readonly [T, ...T[]]>,
      partitionValue?: (a: PM) => string
    ) => Effect<StoreMaker, never, Store<PM, string>>
    where: ReturnType<typeof makeWhere<PM>>
  } => {
    return class extends RepositoryBase<Service>()<T, PM, Evt, ItemType>(itemType) {
      constructor(
        private readonly store: Store<PM, string>,
        private readonly publishEvents: (evt: Iterable<Evt>) => Effect<RequestContext, never, void>
      ) {
        super()
      }

      static makeStore = makeStore<PM>()(itemType, schema, mapTo)

      private mapToPersistenceModel = (
        e: E,
        getEtag: (id: string) => string | undefined
      ): PM => {
        return mapTo(e, getEtag(e.id))
      }

      private mapReverse = (
        { _etag, ...e }: PM,
        setEtag: (id: string, eTag: string | undefined) => void
      ): E => {
        setEtag(e.id, _etag)
        return mapFrom(e)
      }

      private findE(id: T["id"]) {
        return this.store.find(id)
          .flatMap(items =>
            Do($ => {
              const { set } = $(ContextMap.access)
              return items.map(_ => this.mapReverse(_, set))
            })
          )
      }

      override find = (id: T["id"]) => this.findE(id).flatMapOpt(EParserFor(schema).condemnDie)
      private allE = this.store.all.flatMap(items =>
        Do($ => {
          const { set } = $(ContextMap.access)
          return items.map(_ => this.mapReverse(_, set))
        })
      )

      override all = this.allE.flatMap(_ => _.forEachEffect(EParserFor(schema).condemnDie))
      private saveAllE = (a: Iterable<E>) =>
        Effect(a.toNonEmptyArray)
          .flatMapOpt(a =>
            Do($ => {
              const { get, set } = $(ContextMap.access)
              const items = a.mapNonEmpty(_ => this.mapToPersistenceModel(_, get))
              const ret = $(this.store.batchSet(items))
              ret.forEach(_ => set(_.id, _._etag))
            })
          )

      private saveAll = (a: Iterable<T>) => this.saveAllE(a.toChunk.map(Encoder.for(schema)))

      override saveAndPublish = (items: Iterable<T>, _: Iterable<Evt> = []) =>
        this.saveAll(items)
          > this.publishEvents(_)

      override utils = {
        mapReverse: this.mapReverse,
        parse: Parser.for(schema).unsafe,
        filter: this.store.filter,
        all: this.store.all
      }
    }
  }
}
