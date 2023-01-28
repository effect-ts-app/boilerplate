import { matchAllAlt } from "./lib/routing.js"
import * as Controllers from "./Usecases.js"

export const all = Effect.struct(Controllers).flatMap(_ => Effect.struct(matchAllAlt(_)))
