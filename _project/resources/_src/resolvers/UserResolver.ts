import { UserId } from "@effect-app-boilerplate/models/User"
import { ApiConfig, clientFor, NotFoundError } from "@effect-app/prelude/client"
import * as UsersRsc from "../Users.js"
import { UserView } from "../Views/UserView.js"

interface GetUserViewById extends EffectRequest<NotFoundError<"User">, UserView> {
  readonly _tag: "GetUserViewById"
  readonly id: UserId
}
const GetUserViewById = EffectRequest.tagged<GetUserViewById>("GetUserViewById")

const userClient = clientFor(UsersRsc)

const getUserViewByIdResolver = RequestResolver
  .makeBatched((requests: GetUserViewById[]) =>
    requests
      .toNonEmpty
      .map((_) => userClient.index.handler({ filterByIds: _.map((_) => _.id) }).map((_) => _.body.users).orDie)
      .getOrElse(() => Effect.succeed([]))
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
  .batchN(25)
  .contextFromServices(HttpClient, ApiConfig.Tag)

export const UserViewFromId: Schema<ApiConfig | HttpClient.Default, string, UserView> = S.transformOrFail(
  UserId,
  S.to(UserView),
  (id) => Effect.request(GetUserViewById({ id }), getUserViewByIdResolver).orDie,
  (u) => Effect.succeed(u.id)
)
