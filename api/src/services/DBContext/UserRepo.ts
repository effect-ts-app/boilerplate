import { NotFoundError, NotLoggedInError } from "@effect-app/infra/errors"
import { RepositoryDefaultImpl } from "@effect-app/infra/services/RepositoryBase"
import { generate, generateFromArbitrary } from "@effect-app/infra/test.arbs"
import { RepoConfig } from "api/config"
import { RepoLive } from "api/migrate"
import { Effect, Exit, Layer, Option, ReadonlyArray, Request, RequestResolver, S } from "effect-app"
import { fakerArb } from "effect-app/faker"
import { Email } from "effect-app/schema"
import fc from "fast-check"
import type { UserId } from "models/User"
import { User } from "models/User"
import { UserProfile } from "../UserProfile"

export interface UserPersistenceModel extends User.From {
  _etag: string | undefined
}

export type UserSeed = "sample" | ""

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

  static readonly UserFromIdLayer = Layer
    .effect(
      User.resolver,
      Effect
        .andThen(this, (userRepo) =>
          getUserByIdResolver
            .pipe(
              Effect.provideService(this, userRepo),
              Effect.map((resolver) => (id: UserId) =>
                Effect
                  .request(GetUserById({ id }), resolver)
                  .pipe(Effect.orDie)
              )
            ))
    )
    .pipe(Layer.provide(this.Live))

  get getCurrentUser() {
    return Effect
      .serviceOption(UserProfile)
      .andThen((_) => _.pipe(Effect.mapError(() => new NotLoggedInError())))
      .andThen((_) => this.get(_.sub))
  }

  static getCurrentUser = Effect.serviceConstants(this).getCurrentUser
}

interface GetUserById extends Request.Request<User, NotFoundError<"User">> {
  readonly _tag: "GetUserById"
  readonly id: UserId
}
const GetUserById = Request.tagged<GetUserById>("GetUserById")

const getUserByIdResolver = RequestResolver
  .makeBatched((requests: GetUserById[]) =>
    UserRepo
      .query((where) => where("id", "in", requests.map((_) => _.id)))
      .andThen((users) =>
        requests.forEachEffect(
          (r) =>
            Request.complete(
              r,
              users
                .findFirstMap((_) => _.id === r.id ? Option.some(Exit.succeed(_)) : Option.none())
                .getOrElse(() => Exit.fail(new NotFoundError({ type: "User", id: r.id })))
            ),
          { discard: true }
        )
      )
  )
  .pipe(
    RequestResolver.batchN(25),
    RequestResolver.contextFromServices(UserRepo)
  )
