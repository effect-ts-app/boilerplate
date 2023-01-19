import { User } from "@effect-app-boilerplate/types/User"

export class GetMeRequest extends Get("/me")<GetMeRequest>()({}) {}

export class GetMeResponse extends Model<GetMeResponse>()({ ...User.Api.props }) {}
