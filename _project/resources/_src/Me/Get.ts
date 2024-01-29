import { User } from "@effect-app-boilerplate/models/User"

export class GetMeRequest extends Get()<GetMeRequest>()({}) {}

// TODO
// export class GetMeResponse extends User.extend<GetMeResponse>()({}) {}
export const GetMeResponse = User
