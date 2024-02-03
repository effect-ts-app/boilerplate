import { UsersRsc } from "@effect-app-boilerplate/resources"
import { UserView } from "@effect-app-boilerplate/resources/Views"
import { UserRepo } from "api/services.js"

const users = matchFor(UsersRsc)

const Index = users.Index(
  { UserRepo },
  (req, { Response, userRepo }) =>
    userRepo
      .project({
        filter: UserRepo.query((where) => where("id", "in", req.filterByIds)),
        select: ["id", "displayName", "role"]
      })
      // TODO: decode as part of projection
      .andThen((_) => _.forEachEffect((_) => UserView.decode(_)).orDie)
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
