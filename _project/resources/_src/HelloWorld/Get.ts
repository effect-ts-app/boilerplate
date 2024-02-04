import { User } from "@effect-app-boilerplate/models/User"
import { S } from "@effect-app/prelude"
import { Class, string, unknown } from "@effect-app/prelude/schema"
import { Req } from "../lib.js"

export class GetHelloWorldRequest extends Req({ allowAnonymous: true, allowRoles: ["user"] })<GetHelloWorldRequest>()({
  echo: string
}) {}

export class Response extends Class<Response>()({
  now: S.Date.withDefault(),
  echo: string,
  context: unknown,
  currentUser: User.nullable,
  randomUser: User
}) {}
