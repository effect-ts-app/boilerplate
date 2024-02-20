import { Effect, Exit, Request, RequestResolver } from "effect"
import { Option, S } from "effect-app"
import { ApiConfig, clientFor, NotFoundError } from "effect-app/client"
import { HttpClient } from "effect-app/http"
import { type Schema } from "effect-app/schema"
import { UserId } from "models/User"
import * as UsersRsc from "../Users"
import { UserView } from "../Views/UserView"

interface GetUserViewById extends Request.Request<UserView, NotFoundError<"User">> {
  readonly _tag: "GetUserViewById"
  readonly id: UserId
}
const GetUserViewById = Request.tagged<GetUserViewById>("GetUserViewById")

const userClient = clientFor(UsersRsc)

const getUserViewByIdResolver = RequestResolver
  .makeBatched((requests: GetUserViewById[]) =>
    userClient
      .Index
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
  .pipe(RequestResolver.batchN(25), RequestResolver.contextFromServices(HttpClient.Client, ApiConfig.Tag))

export const UserViewFromId: Schema<UserView, string, ApiConfig | HttpClient.Client.Default> = S.transformOrFail(
  UserId,
  S.to(UserView),
  (id) => Effect.request(GetUserViewById({ id }), getUserViewByIdResolver).pipe(Effect.orDie),
  (u) => Effect.succeed(u.id)
)
