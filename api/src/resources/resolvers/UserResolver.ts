import { Effect, Exit, Request, RequestResolver } from "effect"
import { Option, pipe, ReadonlyArray, S } from "effect-app"
import { ApiConfig, clientFor, NotFoundError } from "effect-app/client"
import { HttpClient } from "effect-app/http"
import { type Schema } from "effect-app/schema"
import { UserId } from "models/User.js"
import * as UsersRsc from "../Users.js"
import { UserView } from "../Views/UserView.js"

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
      .handler({ filterByIds: pipe(requests.map((_) => _.id), ReadonlyArray.toNonEmptyArray, Option.getOrUndefined)! })
      .pipe(
        Effect.andThen(({ body: { users } }) =>
          Effect.forEach(requests, (r) =>
            Request.complete(
              r,
              ReadonlyArray
                .findFirst(users, (_) => _.id === r.id ? Option.some(Exit.succeed(_)) : Option.none())
                .pipe(Option.getOrElse(() => Exit.fail(new NotFoundError({ type: "User", id: r.id }))))
            ), { discard: true })
        ),
        Effect.orDie
      )
  )
  .pipe(RequestResolver.batchN(25), RequestResolver.contextFromServices(HttpClient.Client, ApiConfig.Tag))

export const UserViewFromId: Schema<UserView, string, ApiConfig | HttpClient.Client.Default> = S.transformOrFail(
  UserId,
  S.typeSchema(UserView),
  (id) => Effect.request(GetUserViewById({ id }), getUserViewByIdResolver).pipe(Effect.orDie),
  (u) => Effect.succeed(u.id)
)
