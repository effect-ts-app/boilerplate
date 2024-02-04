import { User } from "@effect-app-boilerplate/models/User"
import { Req } from "../lib.js"

export class GetMeRequest extends Req()<GetMeRequest>()({}) {}

export const GetMeResponse = User
