import { User } from "models/User"
import { S } from "resources/lib"

export class GetMeRequest extends S.Req()<GetMeRequest>()({}) {}

export const GetMeResponse = User
