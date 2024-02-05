import { User } from "@effect-app-boilerplate/models/User"
import { S } from "@effect-app/prelude"

export class GetMeRequest extends S.Req()<GetMeRequest>()({}) {}

export const GetMeResponse = User
