import { UserId } from "@effect-app-boilerplate/models/User"
import { Option, S } from "@effect-app/prelude"
import { ApiConfig, clientFor, NotFoundError } from "@effect-app/prelude/client"
import type { EffectRequest } from "@effect-app/prelude/Request"
import { HttpClient } from "@effect-app/prelude/Request"
import { type Schema } from "@effect-app/prelude/schema"
import { Effect, Exit, Request, RequestResolver } from "effect"
import * as UsersRsc from "../Users.js"
import { UserView } from "../Views/UserView.js"

interface GetUserViewById extends EffectRequest<NotFoundError<"User">, UserView> {
  readonly _tag: "GetUserViewById"
  readonly id: UserId
}
const GetUserViewById = Request.tagged<GetUserViewById>("GetUserViewById")

const userClient = clientFor(UsersRsc)

const getUserViewByIdResolver = RequestResolver
  .makeBatched((requests: GetUserViewById[]) =>
    userClient
      .index
      .handler({ filterByIds: requests.map((_) => _.id).toNonEmpty.value! })
      .andThen(({ body: { users } }) =>
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
      .pipe(Effect.orDie)
  )
  .pipe(RequestResolver.batchN(25), RequestResolver.contextFromServices(HttpClient, ApiConfig.Tag))

export const UserViewFromId: Schema<UserView, string, ApiConfig | HttpClient.Default> = S.transformOrFail(
  UserId,
  S.to(UserView),
  (id) => Effect.request(GetUserViewById({ id }), getUserViewByIdResolver).pipe(Effect.orDie),
  (u) => Effect.succeed(u.id)
)
