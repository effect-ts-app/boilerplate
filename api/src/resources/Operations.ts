import { Operation, OperationId } from "effect-app/Operations"
import { S } from "./lib.js"

export class FindOperation extends S.Req<FindOperation>()({
  id: OperationId
}, { allowAnonymous: true, allowRoles: ["user"], success: S.NullOr(Operation) }) {}

// codegen:start {preset: meta, sourcePrefix: src/resources/}
export const meta = { moduleName: "Operations" }
// codegen:end
