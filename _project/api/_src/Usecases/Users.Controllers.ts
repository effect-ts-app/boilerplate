import { UsersRsc } from "@effect-app-boilerplate/resources"
import type { UserView } from "@effect-app-boilerplate/resources/Views"
import { matchFor } from "api/lib/matchFor.js"
import { UserRepo } from "api/services.js"
import { ReadonlyArray } from "effect"
import { Order } from "effect-app"

const users = matchFor(UsersRsc)

const Index = users.Index(
  (req, { Response }) =>
    UserRepo
      .query({ filter: UserRepo.Query((where) => where("id", "in", req.filterByIds)) })
      .andThen((users) =>
        new Response({
          users: ReadonlyArray
            .sort(users, Order.mapInput(Order.string, (_: UserView) => _.displayName))
        })
      )
)

export default users.controllers({
  Index
})
