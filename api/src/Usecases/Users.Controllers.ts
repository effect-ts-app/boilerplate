import { matchFor } from "api/lib/matchFor.js"
import { Q, UserRepo } from "api/services.js"
import { Array } from "effect"
import { Effect, Order } from "effect-app"
import { UsersRsc } from "resources.js"
import type { UserView } from "resources/Views.js"

const users = matchFor(UsersRsc)

export default users.controllers({
  Index: users.Index((req) =>
    UserRepo
      .query(Q.where("id", "in", req.filterByIds))
      .pipe(Effect.andThen((users) => ({
        users: Array
          .sort(users, Order.mapInput(Order.string, (_: UserView) => _.displayName))
      })))
  )
})
