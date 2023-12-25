import { User } from "@effect-app-boilerplate/models/User"

@useClassFeaturesForSchema
export class GetMeRequest extends Get("/me")<GetMeRequest>()({}) {}

// TODO
// export class GetMeResponse extends User.extend<GetMeResponse>()({}) {}
export const GetMeResponse = User
