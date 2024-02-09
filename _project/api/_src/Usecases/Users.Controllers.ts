import { UsersRsc } from "@effect-app-boilerplate/resources"
import type { UserView } from "@effect-app-boilerplate/resources/Views"
import { query } from "@effect-app/infra/services/Repository"
import { Order } from "@effect-app/prelude"
import { matchFor } from "api/lib/matchFor.js"
import { UserRepo } from "api/services.js"
import { ReadonlyArray } from "effect"

const users = matchFor(UsersRsc)

const Index = users.Index(
  { UserRepo },
  (req, { Response, userRepo }) =>
    query(userRepo, {
      filter: UserRepo.query((where) => where("id", "in", req.filterByIds))
    })
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
