import { User } from "@effect-app-boilerplate/models/User"
import type { UserId } from "@effect-app-boilerplate/models/User"
import { Filters } from "@effect-app/infra/filter"
import { NotFoundError } from "api/errors.js"
import { UserRepo } from "../UserRepo.js"

interface GetUserById extends EffectRequest<NotFoundError<"User">, User> {
  readonly _tag: "GetUserById"
  readonly id: UserId
}
const GetUserById = EffectRequest.tagged<GetUserById>("GetUserById")

const getUserByIdResolver = RequestResolver
  .makeBatched((requests: GetUserById[]) =>
    UserRepo.andThen((_) =>
      _
        .query({ filter: UserRepo.where((_) => _("id", Filters.in(...requests.map((_) => _.id)))) })
        .flatMap((users) =>
          requests.forEachEffect(
            (r) => {
              const u = users.find((_) => _.id === r.id)
              return EffectRequest.complete(
                r,
                u ? Exit.succeed(u) : Exit.fail(new NotFoundError({ type: "User", id: r.id }))
              )
            }
          )
        )
    )
  )
  .batchN(25)
  .contextFromServices(UserRepo)

/**
 * @tsplus static UserRepo UserFromIdLayer
 */
export const getUserByIdResolverLayer = Layer
  .effect(
    User.resolver,
    UserRepo.andThen((userRepo) =>
      getUserByIdResolver
        .provideService(UserRepo, userRepo)
        .map(
          (resolver) => (id: UserId) =>
            Effect
              .request(GetUserById({ id }), resolver)
              .orDie
        )
    )
  )
  .provide(UserRepo.Live)
