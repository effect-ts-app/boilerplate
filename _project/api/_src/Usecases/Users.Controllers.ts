import { UsersRsc } from "@effect-app-boilerplate/resources"
import type { UserView } from "@effect-app-boilerplate/resources/Views"
import { UserRepo } from "api/services.js"

const users = matchFor(UsersRsc)

const Index = users.Index(
  { UserRepo },
  (req, { Response, userRepo }) =>
    userRepo
      .query({
        filter: UserRepo.query((where) => where("id", "in", req.filterByIds))
      })
      .map((users) =>
        new Response({
          users: users
            .sortBy(Order.string.mapInput((_: UserView) => _.displayName))
            .toArray
        })
      )
)

export default users.controllers({
  Index
})
