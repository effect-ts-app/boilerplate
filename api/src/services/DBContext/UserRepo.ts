import { NotFoundError, NotLoggedInError } from "@effect-app/infra/errors"
import { RepositoryDefaultImpl } from "@effect-app/infra/services/RepositoryBase"
import { generate } from "@effect-app/infra/test.arbs"
import { RepoConfig } from "api/config.js"
import { RepoLive } from "api/migrate.js"
import { Array, Effect, Exit, Layer, Option, pipe, Request, RequestResolver, S } from "effect-app"
import { fakerArb } from "effect-app/faker"
import { Email } from "effect-app/schema"
import fc from "fast-check"
import type { UserId } from "models/User.js"
import { User } from "models/User.js"
import { Q } from "../lib.js"
import { UserProfile } from "../UserProfile.js"

export interface UserPersistenceModel extends User.From {
  _etag: string | undefined
}

export type UserSeed = "sample" | ""

export class UserRepo extends RepositoryDefaultImpl<UserRepo>()(
  "User",
  User
) {
  static Live = Effect
    .andThen(RepoConfig, (cfg) => {
      const seed = cfg.fakeUsers === "seed" ? "seed" : cfg.fakeUsers === "sample" ? "sample" : ""
      const fakeUsers = pipe(
        Array
          .range(1, 8)
          .map((_, i): User => {
            const g = generate(S.A.make(User)).value
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
          }),
        Array.toNonEmptyArray,
        Option
          .match({
            onNone: () => {
              throw new Error("must have fake users")
            },
            onSome: (_) => _
          })
      )
      const makeInitial = Effect.sync(() => {
        const items = seed === "sample" ? fakeUsers : []
        return items
      })
      return UserRepo
        .makeWith({ makeInitial }, (_) => new UserRepo(_))
        .pipe(Layer.effect(UserRepo))
    })
    .pipe(Layer.unwrapEffect, Layer.provide(RepoLive))

  static readonly UserFromIdLayer = User
    .resolver
    .toLayer(
      Effect
        .andThen(this, (userRepo) =>
          getUserByIdResolver
            .pipe(
              Effect.provideService(this, userRepo),
              Effect.map((resolver) => ({
                get: (id: UserId) =>
                  Effect
                    .request(GetUserById({ id }), resolver)
                    .pipe(Effect.orDie)
              }))
            ))
    )
    .pipe(Layer.provide(this.Live))

  get tryGetCurrentUser() {
    return pipe(
      Effect.serviceOption(UserProfile),
      Effect.andThen((_) => _.pipe(Effect.mapError(() => new NotLoggedInError()))),
      Effect.andThen((_) => this.get(_.sub))
    )
  }

  get getCurrentUser() {
    return pipe(
      UserProfile,
      Effect.andThen((_) => this.get(_.sub))
    )
  }

  static getCurrentUser = Effect.serviceConstants(this).getCurrentUser
  static tryGetCurrentUser = Effect.serviceConstants(this).tryGetCurrentUser
}

interface GetUserById extends Request.Request<User, NotFoundError<"User">> {
  readonly _tag: "GetUserById"
  readonly id: UserId
}
const GetUserById = Request.tagged<GetUserById>("GetUserById")

const getUserByIdResolver = RequestResolver
  .makeBatched((requests: GetUserById[]) =>
    UserRepo
      .query(Q.where("id", "in", requests.map((_) => _.id)))
      .pipe(Effect.andThen((users) =>
        Effect.forEach(requests, (r) =>
          Request.complete(
            r,
            Array
              .findFirst(users, (_) => _.id === r.id ? Option.some(Exit.succeed(_)) : Option.none())
              .pipe(Option.getOrElse(() => Exit.fail(new NotFoundError({ type: "User", id: r.id }))))
          ), { discard: true })
      ))
  )
  .pipe(
    RequestResolver.batchN(25),
    RequestResolver.contextFromServices(UserRepo)
  )
