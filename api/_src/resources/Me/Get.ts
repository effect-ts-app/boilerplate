import { User } from "@effect-app-boilerplate/api/models/User"
import { S } from "@effect-app-boilerplate/api/resources/lib"

export class GetMeRequest extends S.Req()<GetMeRequest>()({}) {}

export const GetMeResponse = User
