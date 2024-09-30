import { matchFor } from "api/lib/routing.js"
import { Q, UserRepo } from "api/services.js"
import { Array } from "effect"
import { Effect, Order } from "effect-app"
import { UsersRsc } from "resources.js"
import type { UserView } from "resources/views.js"

const users = matchFor(UsersRsc)

export default users.controllers({
  IndexUsers: class extends users.IndexUsers((req) =>
    UserRepo
      .query(Q.where("id", "in", req.filterByIds))
      .pipe(Effect.andThen((users) => ({
        users: Array
          .sort(users, Order.mapInput(Order.string, (_: UserView) => _.displayName))
      })))
  ) {}
})
