import { User } from "@effect-ts-app/types/User"

export class GetMeRequest extends Get("/me")<GetMeRequest>()({}) {}

export class GetMeResponse extends Model<GetMeResponse>()({ ...User.Api.props }) {}
