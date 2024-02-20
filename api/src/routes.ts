import { Effect } from "effect-app"
import { matchAll } from "./lib/matchFor"
import * as Controllers from "./Usecases"

export const all = Effect.all(matchAll(Controllers))
