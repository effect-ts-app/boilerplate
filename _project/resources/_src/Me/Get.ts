import { User } from "@effect-app-boilerplate/models/User"

export class GetMeRequest extends Req()<GetMeRequest>()({}) {}

export const GetMeResponse = User
