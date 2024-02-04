import { UserId } from "@effect-app-boilerplate/models/User"
import { S } from "@effect-app/prelude"
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
    requests
      .toNonEmpty
      .map((_) =>
        userClient.index.handler({ filterByIds: _.map((_) => _.id) }).andThen((_) => _.body.users).pipe(Effect.orDie)
      )
      .getOrElse(() => Effect.succeed([]))
      .andThen((users) =>
        requests.forEachEffect(
          (r) => {
            const u = users.find((_) => _.id === r.id)
            return Request.complete(
              r,
              u ? Exit.succeed(u) : Exit.fail(new NotFoundError({ type: "User", id: r.id }))
            )
          },
          { discard: true }
        )
      )
  )
  .pipe(RequestResolver.batchN(25), RequestResolver.contextFromServices(HttpClient, ApiConfig.Tag))

export const UserViewFromId: Schema<ApiConfig | HttpClient.Default, string, UserView> = S.transformOrFail(
  UserId,
  S.to(UserView),
  (id) => Effect.request(GetUserViewById({ id }), getUserViewByIdResolver).pipe(Effect.orDie),
  (u) => Effect.succeed(u.id)
)
