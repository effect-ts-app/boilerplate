import { User } from "@effect-app-boilerplate/models/User"
import { S } from "@effect-app-boilerplate/resources/lib"

export class GetMeRequest extends S.Req()<GetMeRequest>()({}) {}

export const GetMeResponse = User
