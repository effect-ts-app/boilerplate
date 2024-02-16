import { User } from "models/User.js"
import { S } from "resources/lib.js"

export class GetMeRequest extends S.Req()<GetMeRequest>()({}) {}

export const GetMeResponse = User
