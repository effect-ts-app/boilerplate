import { User } from "@effect-app-boilerplate/models/User"
import { NotLoggedInError } from "@effect-app/infra/errors"
import { RepositoryDefaultImpl } from "@effect-app/infra/services/RepositoryBase"
import { generate, generateFromArbitrary } from "@effect-app/infra/test.arbs"
import { RepoConfig } from "api/config.js"
import { RepoLive } from "api/migrate.js"
import { Effect, Layer, Option, ReadonlyArray } from "effect"
import { S } from "effect-app"
import { fakerArb } from "effect-app/faker"
import { Email } from "effect-app/schema"
import fc from "fast-check"
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
        .map((_, i): User => {
          const g = generateFromArbitrary(S.A.make(User)).value
          const emailArb = fakerArb((_) => () =>
            _
              .internet
              .exampleEmail({ firstName: g.name.firstName, lastName: g.name.lastName })
          )
          return new User({
            ...g,
            email: Email(generate(emailArb(fc)).value),
            role: i === 0 || i === 1 ? "manager" : "user"
          })
        })
        .toNonEmpty
        .pipe(Option
          .match({
            onNone: () => {
              throw new Error("must have fake users")
            },
            onSome: (_) => _
          }))
      const makeInitial = Effect.sync(() => {
        const items = seed === "sample" ? fakeUsers : []
        return items
      })
      return UserRepo
        .makeWith({ makeInitial }, (_) => new UserRepo(_))
        .pipe(Layer.effect(UserRepo))
    })
    .pipe(Layer.unwrapEffect, Layer.provide(RepoLive))

  get getCurrentUser() {
    return Effect
      .serviceOption(UserProfile)
      .andThen((_) => _.pipe(Effect.mapError(() => new NotLoggedInError())))
      .andThen((_) => this.get(_.sub))
  }
}
