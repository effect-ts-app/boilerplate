import { Effect, Exit, Request, RequestResolver } from "effect"
import { Array, Option, pipe, S } from "effect-app"
import { ApiConfig, NotFoundError } from "effect-app/client"
import { HttpClient } from "effect-app/http"
import { type Schema } from "effect-app/schema"
import { UserId } from "models/User.js"
import { clientFor } from "resources/lib/clientFor.js"
import * as UsersRsc from "../Users.js"
import { UserView } from "../views/UserView.js"

interface GetUserViewById extends Request.Request<UserView, NotFoundError<"User">> {
  readonly _tag: "GetUserViewById"
  readonly id: UserId
}
const GetUserViewById = Request.tagged<GetUserViewById>("GetUserViewById")

const userClient = clientFor(UsersRsc)

const getUserViewByIdResolver = RequestResolver
  .makeBatched((requests: GetUserViewById[]) =>
    userClient
      .IndexUsers
      .handler({ filterByIds: pipe(requests.map((_) => _.id), Array.toNonEmptyArray, Option.getOrUndefined)! })
      .pipe(
        Effect.andThen(({ body: { users } }) =>
          Effect.forEach(requests, (r) =>
            Request.complete(
              r,
              Array
                .findFirst(users, (_) => _.id === r.id ? Option.some(Exit.succeed(_)) : Option.none())
                .pipe(Option.getOrElse(() => Exit.fail(new NotFoundError({ type: "User", id: r.id }))))
            ), { discard: true })
        ),
        Effect.orDie
      )
  )
  .pipe(RequestResolver.batchN(25), RequestResolver.contextFromServices(HttpClient.HttpClient, ApiConfig.Tag))

export const UserViewFromId: Schema<UserView, string, ApiConfig | HttpClient.HttpClient.Service> = S.transformOrFail(
  UserId,
  S.typeSchema(UserView),
  {
    decode: (id) => Effect.request(GetUserViewById({ id }), getUserViewByIdResolver).pipe(Effect.orDie),
    encode: (u) => Effect.succeed(u.id)
  }
)
