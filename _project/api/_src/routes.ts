import { matchAllAlt } from "./lib/routing.js"
import * as Controllers from "./Usecases.js"

export const all = Effect.all(Controllers).flatMap(_ => Effect.all(matchAllAlt(_)))
