import { NotFoundError } from "effect-app/client"
import { User } from "models/User.js"
import { S } from "./lib.js"

export class GetMe extends S.Req<GetMe>()("GetMe", {}, { success: User, failure: NotFoundError }) {}

// codegen:start {preset: meta, sourcePrefix: src/resources/}
export const meta = { moduleName: "Me" } as const
// codegen:end
