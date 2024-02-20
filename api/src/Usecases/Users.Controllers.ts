import { matchFor } from "api/lib/matchFor"
import { UserRepo } from "api/services"
import { ReadonlyArray } from "effect"
import { Order } from "effect-app"
import { UsersRsc } from "resources"
import type { UserView } from "resources/Views"

const users = matchFor(UsersRsc)

export default users.controllers({
  Index: users.Index((req) =>
    UserRepo
      .query((where) => where("id", "in", req.filterByIds))
      .andThen((users) => ({
        users: ReadonlyArray
          .sort(users, Order.mapInput(Order.string, (_: UserView) => _.displayName))
      }))
  )
})
