import { User } from "models/User.js"
import { S } from "./lib.js"

export class GetMe extends S.Req<GetMe>()({}, { success: User }) {}

// codegen:start {preset: meta, sourcePrefix: src/resources/}
export const meta = { moduleName: "Me" }
// codegen:end
