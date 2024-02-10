import { Effect } from "effect-app"
import { matchAll } from "./lib/matchFor.js"
import * as Controllers from "./Usecases.js"

export const all = Effect.all(matchAll(Controllers))
