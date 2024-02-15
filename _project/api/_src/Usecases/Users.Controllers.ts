import { UsersRsc } from "@effect-app-boilerplate/api/resources"
import type { UserView } from "@effect-app-boilerplate/api/resources/Views"
import { matchFor } from "api/lib/matchFor.js"
import { UserRepo } from "api/services.js"
import { ReadonlyArray } from "effect"
import { Order } from "effect-app"

const users = matchFor(UsersRsc)

export default users.controllers({
  Index: users.Index((req) =>
    UserRepo
      .query({ filter: UserRepo.Query((where) => where("id", "in", req.filterByIds)) })
      .andThen((users) => ({
        users: ReadonlyArray
          .sort(users, Order.mapInput(Order.string, (_: UserView) => _.displayName))
      }))
  )
})
