import { User } from "@effect-app-boilerplate/models/User"
import { RepositoryDefaultImpl } from "@effect-app/infra/services/RepositoryBase"
import { UserProfile } from "../UserProfile.js"

export interface UserPersistenceModel extends User.Encoded {
  _etag: string | undefined
}

const fakeUsers = ReadonlyArray.range(1, 8)
  .map((_, i): User => ({
    ...User.Arbitrary.generate.value,
    role: i === 0 || i === 1 ? "manager" : "user"
  })).toNonEmpty
  .match(() => {
    throw new Error("must have fake users")
  }, _ => _)

export type UserSeed = "sample" | ""

/**
 * @tsplus type UserRepo
 * @tsplus companion UserRepo.Ops
 */
export class UserRepo extends RepositoryDefaultImpl<UserRepo>()<UserPersistenceModel>()(
  "User",
  User,
  pm => pm,
  (e, _etag) => ({ ...e, _etag })
) {}

/**
 * @tsplus static UserRepo.Ops Live
 */
export function LiveUserRepo(seed: UserSeed) {
  const makeInitial = Effect.sync(() => {
    const items = seed === "sample" ? fakeUsers : []
    return items
  })
  return UserRepo
    .toLayer((_: Iterable<never>) => Effect.unit, makeInitial)
}

/**
 * @tsplus getter UserRepo getCurrentUser
 */
export function getCurrentUser(repo: UserRepo) {
  return UserProfile.flatMap(_ => _.get.flatMap(_ => repo.get(_.id)))
}

/**
 * @tsplus fluent UserRepo update
 */
export function update(repo: UserRepo, mod: (user: User) => User) {
  return UserProfile.flatMap(_ => _.get.flatMap(_ => repo.get(_.id)).map(mod).flatMap(repo.save))
}

/**
 * @tsplus fluent UserRepo updateWithEffect
 */
export function userUpdateWithEffect<R, E>(repo: UserRepo, mod: (user: User) => Effect<R, E, User>) {
  return UserProfile.flatMap(_ => _.get.flatMap(_ => repo.get(_.id)).flatMap(mod).flatMap(repo.save))
}
