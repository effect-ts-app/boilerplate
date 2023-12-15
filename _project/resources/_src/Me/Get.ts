import { User } from "@effect-app-boilerplate/models/User"

export class GetMeRequest extends Get("/me")<GetMeRequest>()({}) {}

export class GetMeResponse extends Class<GetMeResponse>()({ ...User.Api.fields }) {}
