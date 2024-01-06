import { User } from "@effect-app-boilerplate/models/User"
import { NotLoggedInError } from "@effect-app/infra/errors"
import { RepositoryDefaultImpl } from "@effect-app/infra/services/RepositoryBase"
import { RepoConfig } from "api/config.js"
import { RepoLive } from "api/migrate.js"
import { UserProfile } from "../UserProfile.js"

export interface UserPersistenceModel extends User.From {
  _etag: string | undefined
}

export type UserSeed = "sample" | ""

/**
 * @tsplus type UserRepo
 * @tsplus companion UserRepo.Ops
 */
export class UserRepo extends RepositoryDefaultImpl<UserRepo>()<UserPersistenceModel>()(
  "User",
  User
) {
  static Live = RepoConfig
    .andThen((cfg) => {
      const seed = cfg.fakeUsers === "seed" ? "seed" : cfg.fakeUsers === "sample" ? "sample" : ""
      const fakeUsers = ReadonlyArray
        .range(1, 8)
        .map((_, i): User => ({
          ...User.Arbitrary.generate.value,
          role: i === 0 || i === 1 ? "manager" : "user"
        }))
        .toNonEmpty
        .match({
          onNone: () => {
            throw new Error("must have fake users")
          },
          onSome: (_) => _
        })
      const makeInitial = Effect.sync(() => {
        const items = seed === "sample" ? fakeUsers : []
        return items
      })
      return UserRepo
        .makeWith({ makeInitial }, (_) => new UserRepo(_))
        .toLayer(UserRepo)
    })
    .unwrapLayer
    .provide(RepoLive)
}

/**
 * @tsplus getter UserRepo getCurrentUser
 */
export function getCurrentUser(repo: UserRepo) {
  return Effect.serviceOption(UserProfile).andThen((_) => _.encaseInEffect(() => new NotLoggedInError())).flatMap((_) =>
    repo.get(_.sub)
  )
}
