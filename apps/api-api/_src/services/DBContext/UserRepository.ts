import type { InvalidStateError, OptimisticConcurrencyException } from "@/errors.js"
import { NotFoundError } from "@/errors.js"
import type { RequestContext } from "@effect-ts-app/boilerplate-infra/lib/RequestContext.js"
import { makeAllDSL, makeOneDSL } from "@effect-ts-app/boilerplate-infra/services/Repository"
import { ContextMap, LiveContextMap, StoreMaker } from "@effect-ts-app/boilerplate-infra/services/Store"
import { makeCodec } from "@effect-ts-app/infra/context/schema"
import type { UserId } from "@effect-ts-app/types/User"
import { User } from "@effect-ts-app/types/User"
import { UserProfile } from "../UserProfile.js"

export interface UserPersistenceModel extends User.Encoded {
  _etag: string | undefined
}

const [_dec, _encode, encodeToMap] = makeCodec(User)
const encodeToMapPM = flow(
  encodeToMap,
  _ =>
    _.flatMap(map =>
      Effect.gen(function*($) {
        const { get } = yield* $(ContextMap)
        return new Map(
          [...map.entries()].map(([k, v]) => [k, mapToPersistenceModel(v, get)])
        )
      })
    )
)

function mapToPersistenceModel(
  e: User.Encoded,
  getEtag: (id: string) => string | undefined
): UserPersistenceModel {
  return {
    ...e,
    _etag: getEtag(e.id)
  }
}

function mapReverse(
  { _etag, ...e }: UserPersistenceModel,
  setEtag: (id: string, eTag: string | undefined) => void
): User.Encoded {
  setEtag(e.id, _etag)
  return e
}

function makeUserRepository() {
  return Do($ => {
    const { make } = $(Effect.service(StoreMaker))

    const makeItems = Effect.sync(() =>
      ROArray.range(1, 8)
        .mapRA((): User => ({ ...User.Arbitrary.generate.value }))
    )

    const store = $(
      make<UserPersistenceModel, string, UserId>(
        "Users",
        makeItems.flatMap(encodeToMapPM).provideLayer(LiveContextMap),
        {
          partitionValue: _ => "primary" /*(isIntegrationEvent(r) ? r.companyId : r.id*/
        }
      )
    )

    const allE = store.all.flatMap(items =>
      Do($ => {
        const { set } = $(Effect.service(ContextMap))
        return items.map(_ => mapReverse(_, set))
      })
    )

    const all = allE.flatMap(_ => _.forEachEffect(User.EParser.condemnDie).map(_ => _.toArray))

    function findE(id: UserId) {
      return store.find(id)
        .flatMap(items =>
          Do($ => {
            const { set } = $(Effect.service(ContextMap))
            return items.map(_ => mapReverse(_, set))
          })
        )
    }

    function getE(id: UserId) {
      return findE(id).flatMap(_ => _.encaseInEffect(() => new NotFoundError("User", id)))
    }

    function get(id: UserId) {
      return getE(id).flatMap(User.EParser.condemnDie)
    }

    const saveE = (a: User.Encoded) =>
      Do($ => {
        const { get, set } = $(Effect.service(ContextMap))
        const e = mapToPersistenceModel(a, get)

        $(
          store.set(e)
            .flatMap(ret => Effect.sync(set(ret.id, ret._etag)))
        )
      })

    const save = (a: User) => saveE(User.Encoder(a))

    function allByIdsE(ids: readonly UserId[]) {
      return allE.map(_ => _.filter(_ => ids.includes(_.id as UserId)))
    }

    function allByIds(ids: readonly UserId[]) {
      return allByIdsE(ids)
        .flatMap(_ =>
          _.forEachEffect(User.EParser.condemnDie)
            .map(_ => _.toArray)
        )
    }

    const r: UserRepository = {
      all,
      get,
      save,
      allByIds
    }
    return r
  })
}

/**
 * @tsplus type UserRepository
 */
export interface UserRepository {
  all: Effect<ContextMap, never, readonly User[]>
  allByIds: (ids: readonly UserId[]) => Effect<ContextMap, never, readonly User[]>
  get: (id: UUID) => Effect<ContextMap, NotFoundError<"User">, User>
  save: (u: User) => Effect<ContextMap | RequestContext, OptimisticConcurrencyException | InvalidStateError, void>
}

/**
 * @tsplus type UserRepository.Ops
 */
export interface UserRepositoryOps extends Tag<UserRepository> {}

export const UserRepository: UserRepositoryOps = Tag<UserRepository>()

/**
 * @tsplus static UserRepository.Ops Live
 */
export function LiveUserRepository() {
  return Layer.fromEffect(UserRepository)(makeUserRepository())
}

/**
 * @tsplus getter UserRepository getCurrentUser
 */
export function getCurrentUser(repo: UserRepository) {
  return UserProfile.withEffect(_ => _.get.flatMap(_ => repo.get(_.id)))
}

/**
 * @tsplus fluent UserRepository update
 */
export function update(repo: UserRepository, mod: (user: User) => User) {
  return UserProfile.withEffect(_ => _.get.flatMap(_ => repo.get(_.id)).map(mod).flatMap(repo.save))
}

/**
 * @tsplus fluent UserRepository updateWithEffect
 */
export function userUpdateWithEffect<R, E>(repo: UserRepository, mod: (user: User) => Effect<R, E, User>) {
  return UserProfile.withEffect(_ => _.get.flatMap(_ => repo.get(_.id)).flatMap(mod).flatMap(repo.save))
}

export const Users$ = makeAllDSL<User, never>()
export const User$ = makeOneDSL<User, never>()
